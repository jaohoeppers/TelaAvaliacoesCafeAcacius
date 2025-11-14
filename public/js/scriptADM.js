function validar_senha() {
    const senha = document.getElementById('admin_password').value;
    fetch('http://localhost:80/progavaliacoescafe/src/backend.php?action=valida_senha&senha=' + encodeURIComponent(senha))
        .then(response => response.json())
        .then(data => {
            if (data.valid) {
                // Salva a sessão no localStorage
                localStorage.setItem('adminAutenticado', 'true');
                localStorage.setItem('timestampLogin', Date.now());
                
                document.getElementById('login_section').style.display = 'none';
                mostrarPaineis();
            } else {
                document.getElementById('login_msg').textContent = 'Senha inválida. Tente novamente.';
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            document.getElementById('login_msg').textContent = 'Erro ao validar senha.';
        });
}
function mostrarPaineis(pularAbaInicial = false) {
    document.getElementById('gestao_section').style.display = 'flex';
    document.getElementById('btn_logout').style.display = 'flex';
    // Abre a aba Geral por padrão apenas se não houver estado salvo
    if (!pularAbaInicial) {
        abrirAbaGeral();
    }
}

// Função para abrir a aba Geral
function abrirAbaGeral() {
    // Remove a classe 'active' de todas as abas
    document.querySelectorAll('.sidebar-tab').forEach(tab => tab.classList.remove('active'));
    // Adiciona 'active' na aba Geral
    document.querySelectorAll('.sidebar-tab')[0].classList.add('active');
    
    // Carrega o conteúdo da aba Geral (função do gerarTelas.js)
    gerarTelaGeral();
}

// Função para abrir a aba Salas
function abrirAbaSalas(gerarConteudo = true) {
    // Remove a classe 'active' de todas as abas
    document.querySelectorAll('.sidebar-tab').forEach(tab => tab.classList.remove('active'));
    // Adiciona 'active' na aba Salas
    document.querySelectorAll('.sidebar-tab')[1].classList.add('active');
    
    // Carrega o conteúdo da aba Salas apenas se solicitado
    if (gerarConteudo) {
        gerarTelaSalas();
    }
}

// ========================================
// SISTEMA DE SESSÃO E ESTADO
// ========================================

// Função para verificar sessão ao carregar a página
function verificarSessao() {
    const autenticado = localStorage.getItem('adminAutenticado');
    const timestamp = localStorage.getItem('timestampLogin');
    
    // Verifica se está autenticado e se a sessão não expirou (24 horas)
    if (autenticado === 'true' && timestamp) {
        const horasDecorridas = (Date.now() - parseInt(timestamp)) / (1000 * 60 * 60);
        
        if (horasDecorridas < 24) {
            // Sessão válida, pula o login
            document.getElementById('login_section').style.display = 'none';
            document.getElementById('btn_logout').style.display = 'flex';
            
            // Verifica se há estado salvo para restaurar
            const estadoSalvo = localStorage.getItem('estadoTela');
            const temEstadoSalvo = estadoSalvo && estadoSalvo !== 'null';
            
            // Mostra painéis (pula aba inicial se houver estado a restaurar)
            mostrarPaineis(temEstadoSalvo);
            
            // Restaura o estado da tela se existir
            if (temEstadoSalvo) {
                restaurarEstadoTela();
            }
        } else {
            // Sessão expirada, limpa o localStorage
            limparSessao();
        }
    }
}

// Função para salvar o estado atual da tela
function salvarEstadoTela(tipo, dados) {
    localStorage.setItem('estadoTela', JSON.stringify({
        tipo: tipo,
        dados: dados,
        timestamp: Date.now()
    }));
}

// Função para restaurar o estado da tela
function restaurarEstadoTela() {
    const estado = localStorage.getItem('estadoTela');
    
    if (estado) {
        const { tipo, dados } = JSON.parse(estado);
        
        if (tipo === 'detalhesSala' && dados.salaId && dados.salaNome) {
            // Restaura a tela de detalhes da sala
            // Ativa a aba Salas sem gerar o grid
            abrirAbaSalas(false);
            // Aguarda um momento e abre os detalhes da sala
            setTimeout(() => {
                abrirDetalhesSala(dados.salaId, dados.salaNome);
            }, 50);
        } else if (tipo === 'salas') {
            // Restaura a tela de salas com o grid
            abrirAbaSalas(true);
        }
        // Adicione outros tipos de tela conforme necessário
    }
}

// Função para limpar a sessão
function limparSessao() {
    localStorage.removeItem('adminAutenticado');
    localStorage.removeItem('timestampLogin');
    localStorage.removeItem('estadoTela');
}

// Função para fazer logout
function logout() {
    limparSessao();
    location.reload();
}

// Verifica a sessão quando a página carrega
window.addEventListener('DOMContentLoaded', verificarSessao);
