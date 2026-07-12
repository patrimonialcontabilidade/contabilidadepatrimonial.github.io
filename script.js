document.getElementById('ano').textContent = new Date().getFullYear();

function alternarMenu() {
  const menu = document.getElementById('menu');
  const botao = document.querySelector('.menu-btn');

  menu.classList.toggle('ativo');
  botao.setAttribute(
    'aria-expanded',
    menu.classList.contains('ativo')
  );
}

// Fecha o menu móvel quando o visitante escolhe uma seção.
document.querySelectorAll('#menu a').forEach((link) => {
  link.addEventListener('click', () => {
    document.getElementById('menu').classList.remove('ativo');

    document
      .querySelector('.menu-btn')
      .setAttribute('aria-expanded', 'false');
  });
});

function enviarWhatsApp(event) {
  event.preventDefault();

  const nome = document.getElementById('nome').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const servico = document.getElementById('servico').value;
  const mensagem =
    document.getElementById('mensagem').value.trim() || 'Não informada';
  const numero = document.getElementById('numeroAtendimento').value;

  const texto = [
    'Olá, Patrimonial Contabilidade!',
    '',
    `Nome: ${nome}`,
    `Telefone/WhatsApp: ${telefone}`,
    `Serviço desejado: ${servico}`,
    `Mensagem: ${mensagem}`
  ].join('\n');

  window.open(
    `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`,
    '_blank',
    'noopener'
  );
}


// Área do Cliente — consulta real EMP + PIN via Google Apps Script.
const PORTAL_API_URL =
  'https://script.google.com/macros/s/AKfycbz7Ml28-OOuWxgNliQoCT8YGY1zMqcyWdVnXSCOu1_bq3YEwd6PrKm9EOjq24VzV2gy/exec';

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

  if (botoes) {
    botoes.hidden = true;
  }

  [
    'linkPortalDigitar',
    'linkPortalFotos',
    'linkPortalPlanilha'
  ].forEach((id) => {
    const link = document.getElementById(id);

    if (link) {
      link.removeAttribute('href');
    }
  });
}

function definirMensagemPortal(texto, tipo = '') {
  const mensagem = document.getElementById('mensagemPortal');

  if (!mensagem) {
    return;
  }

  mensagem.textContent = texto;
  mensagem.className = `mensagem-portal ${tipo}`.trim();
}

function configurarLinksPortal(links) {
  const linkDigitar = document.getElementById('linkPortalDigitar');
  const linkFotos = document.getElementById('linkPortalFotos');
  const linkPlanilha = document.getElementById('linkPortalPlanilha');
  const botoes = document.getElementById('botoesPortalCliente');

  linkDigitar.href = links.digitar;
  linkFotos.href = links.fotos;
  linkPlanilha.href = links.planilha;

  // Ajuda celulares a abrirem os formulários fora do navegador interno.
  linkDigitar.target = '_blank';
  linkFotos.target = '_blank';
  linkPlanilha.target = '_blank';

  linkDigitar.rel = 'noopener noreferrer';
  linkFotos.rel = 'noopener noreferrer';
  linkPlanilha.rel = 'noopener noreferrer';

  botoes.hidden = false;
}

function consultarPortalJsonpUmaVez(codigo, pin) {
  return new Promise((resolve, reject) => {
    const callback =
      `portalCallback_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

    const script = document.createElement('script');
    let finalizado = false;

    const timeout = window.setTimeout(() => {
      finalizarConsulta();

      reject(
        new Error('Tempo de consulta excedido.')
      );
    }, 25000);

    function finalizarConsulta() {
      if (finalizado) {
        return;
      }

      finalizado = true;
      window.clearTimeout(timeout);

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

      try {
        delete window[callback];
      } catch (erro) {
        window[callback] = undefined;
      }
    }

    window[callback] = (dados) => {
      finalizarConsulta();
      resolve(dados);
    };

    script.onerror = () => {
      finalizarConsulta();

      reject(
        new Error('Não foi possível consultar o portal.')
      );
    };

    const params = new URLSearchParams({
      emp: codigo,
      pin: pin,
      callback: callback,
      _: String(Date.now())
    });

    script.src = `${PORTAL_API_URL}?${params.toString()}`;
    script.async = true;

    // Evita reaproveitamento indevido em alguns navegadores móveis.
    script.setAttribute('data-portal-consulta', callback);

    document.head.appendChild(script);
  });
}

async function consultarPortalJsonp(codigo, pin) {
  try {
    return await consultarPortalJsonpUmaVez(codigo, pin);
  } catch (primeiroErro) {
    console.warn(
      'Primeira tentativa de consulta falhou. Tentando novamente.',
      primeiroErro
    );

    // Pequena pausa antes da segunda tentativa.
    await new Promise((resolve) => {
      window.setTimeout(resolve, 1200);
    });

    return consultarPortalJsonpUmaVez(codigo, pin);
  }
}

async function acessarAreaCliente(event) {
  event.preventDefault();

  if (portalConsultaEmAndamento) {
    return;
  }

  const codigoCampo = document.getElementById('codigoPortal');
  const pinCampo = document.getElementById('pinPortal');

  const formulario = event.currentTarget;
  const botao =
    formulario.querySelector('.btn-acessar-area') ||
    document.querySelector('.btn-acessar-area');

  const codigo = codigoCampo.value.trim().toUpperCase();
  const pin = pinCampo.value.trim();

  codigoCampo.value = codigo;
  limparAcessoPortal();

  if (!/^EMP\d{3}$/.test(codigo)) {
    definirMensagemPortal(
      'Digite o código no padrão EMP seguido de três números. Exemplo: EMP023.',
      'erro'
    );

    codigoCampo.focus();
    return;
  }

  if (!/^\d{4}$/.test(pin)) {
    definirMensagemPortal(
      'Digite um PIN com quatro números.',
      'erro'
    );

    pinCampo.focus();
    return;
  }

  portalConsultaEmAndamento = true;

  if (botao) {
    botao.disabled = true;
    botao.dataset.textoOriginal = botao.textContent;
    botao.textContent = 'Consultando...';
  }

  definirMensagemPortal(
    'Validando seu acesso...',
    'carregando'
  );

  try {
    const dados = await consultarPortalJsonp(codigo, pin);

    if (!dados || dados.sucesso !== true) {
      definirMensagemPortal(
        dados?.mensagem || 'Código ou PIN não localizado.',
        'erro'
      );

      return;
    }

    if (
      !dados.links ||
      !dados.links.digitar ||
      !dados.links.fotos ||
      !dados.links.planilha
    ) {
      definirMensagemPortal(
        'Acesso localizado, mas os formulários ainda não foram configurados. Fale com a Patrimonial.',
        'erro'
      );

      return;
    }

    configurarLinksPortal(dados.links);

    definirMensagemPortal(
      `Bem-vindo(a), ${dados.nome}. Seus formulários foram liberados.`,
      'sucesso'
    );

    pinCampo.value = '';
  } catch (erro) {
    console.error(
      'Erro na consulta da Área do Cliente:',
      erro
    );

    definirMensagemPortal(
      'Não foi possível concluir a consulta. Verifique sua internet e tente novamente.',
      'erro'
    );
  } finally {
    portalConsultaEmAndamento = false;

    if (botao) {
      botao.disabled = false;
      botao.textContent =
        botao.dataset.textoOriginal || 'Acessar minha área';
    }
  }
}


// Garante que os botões nunca apareçam antes da validação,
// inclusive em arquivo local.
document.addEventListener('DOMContentLoaded', () => {
  limparAcessoPortal();
  definirMensagemPortal('');
});
