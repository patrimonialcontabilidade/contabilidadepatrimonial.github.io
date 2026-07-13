document.getElementById('ano').textContent = new Date().getFullYear();

function alternarMenu() {
  const menu = document.getElementById('menu');
  const botao = document.querySelector('.menu-btn');

  if (!menu || !botao) {
    return;
  }

  menu.classList.toggle('ativo');

  botao.setAttribute(
    'aria-expanded',
    menu.classList.contains('ativo') ? 'true' : 'false'
  );
}


// Fecha o menu móvel quando o visitante escolhe uma seção.
document.querySelectorAll('#menu a').forEach(function (link) {
  link.addEventListener('click', function () {
    const menu = document.getElementById('menu');
    const botao = document.querySelector('.menu-btn');

    if (menu) {
      menu.classList.remove('ativo');
    }

    if (botao) {
      botao.setAttribute('aria-expanded', 'false');
    }
  });
});


function enviarWhatsApp(event) {
  event.preventDefault();

  const nomeCampo = document.getElementById('nome');
  const telefoneCampo = document.getElementById('telefone');
  const servicoCampo = document.getElementById('servico');
  const mensagemCampo = document.getElementById('mensagem');
  const numeroCampo = document.getElementById('numeroAtendimento');

  if (
    !nomeCampo ||
    !telefoneCampo ||
    !servicoCampo ||
    !mensagemCampo ||
    !numeroCampo
  ) {
    return;
  }

  const nome = nomeCampo.value.trim();
  const telefone = telefoneCampo.value.trim();
  const servico = servicoCampo.value;
  const mensagem =
    mensagemCampo.value.trim() || 'Não informada';
  const numero = numeroCampo.value;

  const texto = [
    'Olá, Patrimonial Contabilidade!',
    '',
    'Nome: ' + nome,
    'Telefone/WhatsApp: ' + telefone,
    'Serviço desejado: ' + servico,
    'Mensagem: ' + mensagem
  ].join('\n');

  window.open(
    'https://wa.me/' +
      numero +
      '?text=' +
      encodeURIComponent(texto),
    '_blank',
    'noopener'
  );
}


// ============================================================
// ÁREA DO CLIENTE — EMP + PIN
// ============================================================

const PORTAL_API_URL =
  'https://script.google.com/macros/s/AKfycbz7Ml28-OOuWxgNliQoCT8YGY1zMqcyWdVnXSCOu1_bq3YEwd6PrKm9EOjq24VzV2gy/exec';

let portalConsultaEmAndamento = false;


function alternarPin() {
  const campo = document.getElementById('pinPortal');
  const botao = document.querySelector('.mostrar-pin');

  if (!campo || !botao) {
    return;
  }

  const mostrar = campo.type === 'password';

  campo.type = mostrar ? 'text' : 'password';
  botao.textContent = mostrar ? 'Ocultar' : 'Mostrar';
}


function limparAcessoPortal() {
  const botoes =
    document.getElementById('botoesPortalCliente');

  if (botoes) {
    botoes.hidden = true;
  }

  [
    'linkPortalDigitar',
    'linkPortalFotos',
    'linkPortalPlanilha'
  ].forEach(function (id) {
    const link = document.getElementById(id);

    if (link) {
      link.removeAttribute('href');
    }
  });
}


function definirMensagemPortal(texto, tipo) {
  const mensagem =
    document.getElementById('mensagemPortal');

  if (!mensagem) {
    return;
  }

  mensagem.textContent = texto || '';
  mensagem.className =
    'mensagem-portal' +
    (tipo ? ' ' + tipo : '');
}


function configurarLinkPortal(elemento, endereco) {
  if (!elemento || !endereco) {
    return;
  }

  elemento.href = endereco;
  elemento.target = '_blank';
  elemento.rel = 'noopener noreferrer';
}


function configurarLinksPortal(links) {
  const linkDigitar =
    document.getElementById('linkPortalDigitar');

  const linkFotos =
    document.getElementById('linkPortalFotos');

  const linkPlanilha =
    document.getElementById('linkPortalPlanilha');

  const botoes =
    document.getElementById('botoesPortalCliente');

  configurarLinkPortal(
    linkDigitar,
    links.digitar
  );

  configurarLinkPortal(
    linkFotos,
    links.fotos
  );

  configurarLinkPortal(
    linkPlanilha,
    links.planilha
  );

  if (botoes) {
    botoes.hidden = false;
  }
}


/**
 * Realiza uma consulta JSONP.
 *
 * Usa callback fixo porque:
 * 1) o portal bloqueia consultas simultâneas;
 * 2) esse callback já foi validado diretamente no Apps Script;
 * 3) aumenta a compatibilidade com navegadores móveis.
 */
function consultarPortalJsonpUmaVez(codigo, pin) {
  return new Promise(function (resolve, reject) {
    const callback = 'testePortal';
    const script = document.createElement('script');

    let finalizado = false;

    const timeout = window.setTimeout(function () {
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

      window.setTimeout(function () {
        try {
          delete window[callback];
        } catch (erro) {
          window[callback] = undefined;
        }
      }, 100);
    }


    window[callback] = function (dados) {
      resolve(dados);
      finalizarConsulta();
    };


    script.onerror = function () {
      finalizarConsulta();

      reject(
        new Error(
          'O navegador não conseguiu carregar a resposta do portal.'
        )
      );
    };


    const endereco =
      PORTAL_API_URL +
      '?emp=' +
      encodeURIComponent(codigo) +
      '&pin=' +
      encodeURIComponent(pin) +
      '&callback=' +
      encodeURIComponent(callback) +
      '&_=' +
      new Date().getTime();

    script.src = endereco;
    script.async = true;

    script.setAttribute(
      'data-portal-consulta',
      callback
    );

    document.head.appendChild(script);
  });
}


/**
 * Executa uma segunda tentativa automática caso a primeira falhe.
 */
async function consultarPortalJsonp(codigo, pin) {
  try {
    return await consultarPortalJsonpUmaVez(
      codigo,
      pin
    );
  } catch (primeiroErro) {
    console.warn(
      'Primeira tentativa falhou:',
      primeiroErro
    );

    await new Promise(function (resolve) {
      window.setTimeout(resolve, 1500);
    });

    return consultarPortalJsonpUmaVez(
      codigo,
      pin
    );
  }
}


async function acessarAreaCliente(event) {
  event.preventDefault();

  if (portalConsultaEmAndamento) {
    return;
  }

  const codigoCampo =
    document.getElementById('codigoPortal');

  const pinCampo =
    document.getElementById('pinPortal');

  if (!codigoCampo || !pinCampo) {
    definirMensagemPortal(
      'Não foi possível localizar os campos de acesso.',
      'erro'
    );

    return;
  }

  const formulario = event.currentTarget;

  const botao =
    formulario.querySelector('.btn-acessar-area') ||
    document.querySelector('.btn-acessar-area');

  const codigo =
    codigoCampo.value
      .trim()
      .toUpperCase();

  const pin =
    pinCampo.value.trim();

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

    botao.dataset.textoOriginal =
      botao.textContent;

    botao.textContent =
      'Consultando...';
  }


  definirMensagemPortal(
    'Validando seu acesso...',
    'carregando'
  );


  try {
    const dados =
      await consultarPortalJsonp(
        codigo,
        pin
      );


    if (!dados || dados.sucesso !== true) {
      const mensagemErro =
        dados && dados.mensagem
          ? dados.mensagem
          : 'Código ou PIN não localizado.';

      definirMensagemPortal(
        mensagemErro,
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


    configurarLinksPortal(
      dados.links
    );


    definirMensagemPortal(
      'Bem-vindo(a), ' +
        dados.nome +
        '. Seus formulários foram liberados.',
      'sucesso'
    );


    pinCampo.value = '';
  } catch (erro) {
    console.error(
      'Erro na consulta da Área do Cliente:',
      erro
    );

    definirMensagemPortal(
      'Não foi possível concluir a consulta. Aguarde alguns segundos e tente novamente.',
      'erro'
    );
  } finally {
    portalConsultaEmAndamento = false;

    if (botao) {
      botao.disabled = false;

      botao.textContent =
        botao.dataset.textoOriginal ||
        'Acessar minha área';
    }
  }
}


// Garante que os botões não apareçam antes da validação.
document.addEventListener(
  'DOMContentLoaded',
  function () {
    limparAcessoPortal();
    definirMensagemPortal('');
  }
);
