document.getElementById('ano').textContent = new Date().getFullYear();
function alternarMenu(){
  document.getElementById('menu').classList.toggle('ativo');
}
function enviarWhatsApp(event){
  event.preventDefault();
  const nome = document.getElementById('nome').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const servico = document.getElementById('servico').value;
  const mensagem = document.getElementById('mensagem').value.trim();
  const texto = `Olá, Patrimonial Contabilidade!%0A%0AMeu nome é: ${encodeURIComponent(nome)}%0ATelefone: ${encodeURIComponent(telefone)}%0AServiço desejado: ${encodeURIComponent(servico)}%0AMensagem: ${encodeURIComponent(mensagem)}`;
  window.open(`https://wa.me/5524999548558?text=${texto}`, '_blank');
}
