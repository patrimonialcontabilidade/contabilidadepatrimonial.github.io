document.getElementById('ano').textContent = new Date().getFullYear();

function alternarMenu() {
  const menu = document.getElementById('menu');
  const botao = document.querySelector('.menu-btn');
  menu.classList.toggle('ativo');
  botao.setAttribute('aria-expanded', menu.classList.contains('ativo'));
}

// Fecha o menu móvel quando o visitante escolhe uma seção.
document.querySelectorAll('#menu a').forEach((link) => {
  link.addEventListener('click', () => {
    document.getElementById('menu').classList.remove('ativo');
    document.querySelector('.menu-btn').setAttribute('aria-expanded', 'false');
  });
});

function enviarWhatsApp(event) {
  event.preventDefault();

  const nome = document.getElementById('nome').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const servico = document.getElementById('servico').value;
  const mensagem = document.getElementById('mensagem').value.trim() || 'Não informada';
  const numero = document.getElementById('numeroAtendimento').value;

  const texto = [
    'Olá, Patrimonial Contabilidade!',
    '',
    `Nome: ${nome}`,
    `Telefone/WhatsApp: ${telefone}`,
    `Serviço desejado: ${servico}`,
    `Mensagem: ${mensagem}`
  ].join('\n');

  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
}


// Área do Cliente — consulta real EMP + PIN via Google Apps Script.
const PORTAL_API_URL = 'https://script.google.com/macros/s/AKfycbz7Ml28-OOuWxgNliQoCT8YGY1zMqcyWdVnXSCOu1_bq3YEwd6PrKm9EOjq24VzV2gy/exec';
let portalConsultaEmAndamento = false;

function alternarPin() {
  const campo = document.getElementById('pinPortal');
  const botao = document.querySelector('.mostrar-pin');
  const mostrar = campo.type === 'password';
  campo.type = mostrar ? 'text' : 'password';
  botao.textContent = mostrar ? 'Ocultar' : 'Mostrar';
}

function limparAcessoPortal() {
  const botoes = document.getElementById('botoesPortalCliente');
  botoes.hidden = true;
  ['linkPortalDigitar', 'linkPortalFotos', 'linkPortalPlanilha'].forEach((id) => {
    const link = document.getElementById(id);
    link.removeAttribute('href');
  });
}

function definirMensagemPortal(texto, tipo = '') {
  const mensagem = document.getElementById('mensagemPortal');
  mensagem.textContent = texto;
  mensagem.className = `mensagem-portal ${tipo}`.trim();
}

function configurarLinksPortal(links) {
  document.getElementById('linkPortalDigitar').href = links.digitar;
  document.getElementById('linkPortalFotos').href = links.fotos;
  document.getElementById('linkPortalPlanilha').href = links.planilha;
  document.getElementById('botoesPortalCliente').hidden = false;
}

function consultarPortalJsonp(codigo, pin) {
  return new Promise((resolve, reject) => {
    const callback = 'portalCallback';
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Tempo de consulta excedido.'));
    }, 15000);

    function cleanup() {
      window.clearTimeout(timeout);
      if (script.parentNode) script.parentNode.removeChild(script);
      try { delete window[callback]; } catch (_) { window[callback] = undefined; }
    }

    window[callback] = (dados) => {
      cleanup();
      resolve(dados);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Não foi possível consultar o portal.'));
    };

    const params = new URLSearchParams({
      emp: codigo,
      pin,
      callback,
      _: String(Date.now())
    });
    script.src = `${PORTAL_API_URL}?${params.toString()}`;
    script.async = true;
    document.head.appendChild(script);
  });
}

async function acessarAreaCliente(event) {
  event.preventDefault();
  if (portalConsultaEmAndamento) return;

  const codigoCampo = document.getElementById('codigoPortal');
  const pinCampo = document.getElementById('pinPortal');
  const botao = event.currentTarget.querySelector('.btn-acessar-area');
  const codigo = codigoCampo.value.trim().toUpperCase();
  const pin = pinCampo.value.trim();

  codigoCampo.value = codigo;
  limparAcessoPortal();

  if (!/^EMP\d{3}$/.test(codigo)) {
    definirMensagemPortal('Digite o código no padrão EMP seguido de três números. Exemplo: EMP023.', 'erro');
    codigoCampo.focus();
    return;
  }

  if (!/^\d{4}$/.test(pin)) {
    definirMensagemPortal('Digite um PIN com quatro números.', 'erro');
    pinCampo.focus();
    return;
  }

  portalConsultaEmAndamento = true;
  botao.disabled = true;
  botao.dataset.textoOriginal = botao.textContent;
  botao.textContent = 'Consultando...';
  definirMensagemPortal('Validando seu acesso...', 'carregando');

  try {
    const dados = await consultarPortalJsonp(codigo, pin);

    if (!dados || dados.sucesso !== true) {
      definirMensagemPortal(dados?.mensagem || 'Código ou PIN não localizado.', 'erro');
      return;
    }

    if (!dados.links?.digitar || !dados.links?.fotos || !dados.links?.planilha) {
      definirMensagemPortal('Acesso localizado, mas os formulários ainda não foram configurados. Fale com a Patrimonial.', 'erro');
      return;
    }

    configurarLinksPortal(dados.links);
    definirMensagemPortal(`Bem-vindo(a), ${dados.nome}. Seus formulários foram liberados.`, 'sucesso');
    pinCampo.value = '';
  } catch (erro) {
    console.error(erro);
    definirMensagemPortal('Não foi possível concluir a consulta. Verifique sua internet e tente novamente.', 'erro');
  } finally {
    portalConsultaEmAndamento = false;
    botao.disabled = false;
    botao.textContent = botao.dataset.textoOriginal || 'Acessar minha área';
  }
}


// Garante que os botões nunca apareçam antes da validação, inclusive em arquivo local.
document.addEventListener('DOMContentLoaded', () => {
  limparAcessoPortal();
  definirMensagemPortal('');
});
