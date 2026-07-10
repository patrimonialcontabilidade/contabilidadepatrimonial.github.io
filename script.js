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
