function validar_senha() {
    const senha = document.getElementById('admin_password').value;
    fetch('http://localhost:80/progavaliacoescafe/src/backend.php?action=valida_senha&senha=' + encodeURIComponent(senha))
        .then(response => response.json())
        .then(data => {
            if (data.valid) {
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
function mostrarPaineis() {
    document.getElementById('gestao_section').style.display = 'block';
    gerarPainelRespostas();
    gerarPainelPerguntas();
    gerarPainelSalas();
    gerarPainelGraficos();
}

let todasAsRespostas = [];
let paginaAtualRespostas = 1;

function gerarPainelRespostas() {
    const section = document.getElementById('gestao_section');
    if (!section) return;
    fetch(`http://localhost:80/progavaliacoescafe/src/backend.php?action=get_respostas`)
        .then(response => response.json())
        .then(data => {
            todasAsRespostas = data;
            paginaAtualRespostas = 1;
            section.appendChild(document.createElement('div')).id = 'painelRespostas';
            renderizarPaginaDeRespostas();
        })
        .catch(error => {
            console.error('Erro ao obter respostas:', error);
            const painel = document.getElementById('painelRespostas');
            if (painel) {
                painel.innerHTML = '<p>Erro ao carregar as respostas.</p>';
            }
        });
}

function renderizarPaginaDeRespostas() {
    const itensPorPagina = 100;
    const listaRespostas = document.getElementById('painelRespostas');
    if (!listaRespostas) return;

    listaRespostas.innerHTML = ''; // Limpa o conteúdo anterior

    const totalPaginas = Math.ceil(todasAsRespostas.length / itensPorPagina);
    const inicio = (paginaAtualRespostas - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const respostasDaPagina = todasAsRespostas.slice(inicio, fim);

    // Cria a tabela
    const tabela = document.createElement('table');
    tabela.className = 'tabela-gestao';

    // Cria o cabeçalho da tabela
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>ID</th>
            <th>Pergunta ID</th>
            <th>Sala ID</th>
            <th>Nota</th>
            <th>Data/Hora</th>
        </tr>
    `;
    tabela.appendChild(thead);

    // Cria o corpo da tabela com os dados da página atual
    const tbody = document.createElement('tbody');
    respostasDaPagina.forEach(resposta => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${resposta.id}</td>
            <td>${resposta.pergunta_id}</td>
            <td>${resposta.sala_id}</td>
            <td>${resposta.nota}</td>
            <td>${new Date(resposta.data_hora).toLocaleString('pt-BR')}</td>
        `;
        tbody.appendChild(tr);
    });
    tabela.appendChild(tbody);
    listaRespostas.appendChild(tabela);

    // Cria os controles de paginação
    const paginacaoContainer = document.createElement('div');
    paginacaoContainer.className = 'paginacao';

    const btnAnterior = document.createElement('button');
    btnAnterior.textContent = 'Anterior';
    btnAnterior.disabled = paginaAtualRespostas === 1;
    btnAnterior.onclick = () => {
        if (paginaAtualRespostas > 1) {
            paginaAtualRespostas--;
            renderizarPaginaDeRespostas();
        }
    };

    const indicadorPagina = document.createElement('span');
    indicadorPagina.textContent = `Página ${paginaAtualRespostas} de ${totalPaginas}`;

    const btnProxima = document.createElement('button');
    btnProxima.textContent = 'Próxima';
    btnProxima.disabled = paginaAtualRespostas === totalPaginas;
    btnProxima.onclick = () => {
        if (paginaAtualRespostas < totalPaginas) {
            paginaAtualRespostas++;
            renderizarPaginaDeRespostas();
        }
    };

    paginacaoContainer.appendChild(btnAnterior);
    paginacaoContainer.appendChild(indicadorPagina);
    paginacaoContainer.appendChild(btnProxima);
    listaRespostas.appendChild(paginacaoContainer);
}

// Variáveis para controle de paginação de respostas por pergunta
let respostasPorPergunta = {};
let paginaAtualPorPergunta = {};

function gerarPainelPerguntas() {
    const section = document.getElementById('gestao_section');
    if (!section) return;

    // Cria o container do painel de perguntas
    const painelPerguntas = document.createElement('div');
    painelPerguntas.id = 'painelPerguntas';
    painelPerguntas.innerHTML = '<h2>Perguntas e Respostas</h2>';
    section.appendChild(painelPerguntas);

    // Busca todas as perguntas
    fetch(`http://localhost:80/progavaliacoescafe/src/backend.php?action=get_todas_perguntas`)
        .then(response => response.json())
        .then(perguntas => {
            const accordion = document.createElement('div');
            accordion.className = 'accordion-perguntas';

            perguntas.forEach(pergunta => {
                // Item do accordion
                const item = document.createElement('div');
                item.className = 'accordion-item';

                // Cabeçalho clicável
                const header = document.createElement('div');
                header.className = 'accordion-header';
                header.innerHTML = `
                    <span class="pergunta-texto">Pergunta ${pergunta.id}: ${pergunta.descricao}</span>
                    <span class="arrow">▼</span>
                `;
                header.onclick = () => togglePergunta(pergunta.id, header);

                // Conteúdo (inicialmente oculto)
                const content = document.createElement('div');
                content.className = 'accordion-content';
                content.id = `respostas-pergunta-${pergunta.id}`;
                content.style.display = 'none';

                item.appendChild(header);
                item.appendChild(content);
                accordion.appendChild(item);
            });

            painelPerguntas.appendChild(accordion);
        })
        .catch(error => {
            console.error('Erro ao obter perguntas:', error);
            painelPerguntas.innerHTML += '<p>Erro ao carregar as perguntas.</p>';
        });
}

function togglePergunta(perguntaId, headerElement) {
    const content = document.getElementById(`respostas-pergunta-${perguntaId}`);
    const arrow = headerElement.querySelector('.arrow');

    if (content.style.display === 'none') {
        // Abre o accordion
        content.style.display = 'block';
        arrow.textContent = '▲';

        // Carrega as respostas se ainda não foram carregadas
        if (!respostasPorPergunta[perguntaId]) {
            carregarRespostasDaPergunta(perguntaId);
        }
    } else {
        // Fecha o accordion
        content.style.display = 'none';
        arrow.textContent = '▼';
    }
}

function carregarRespostasDaPergunta(perguntaId) {
    fetch(`http://localhost:80/progavaliacoescafe/src/backend.php?action=get_respostas_por_pergunta&pergunta_id=${perguntaId}`)
        .then(response => response.json())
        .then(data => {
            respostasPorPergunta[perguntaId] = data;
            paginaAtualPorPergunta[perguntaId] = 1;
            renderizarRespostasDaPergunta(perguntaId);
        })
        .catch(error => {
            console.error(`Erro ao obter respostas da pergunta ${perguntaId}:`, error);
            const content = document.getElementById(`respostas-pergunta-${perguntaId}`);
            if (content) {
                content.innerHTML = '<p>Erro ao carregar as respostas.</p>';
            }
        });
}

function renderizarRespostasDaPergunta(perguntaId) {
    const itensPorPagina = 100;
    const content = document.getElementById(`respostas-pergunta-${perguntaId}`);
    if (!content) return;

    const respostas = respostasPorPergunta[perguntaId] || [];
    const paginaAtual = paginaAtualPorPergunta[perguntaId] || 1;

    content.innerHTML = ''; // Limpa o conteúdo anterior

    if (respostas.length === 0) {
        content.innerHTML = '<p>Nenhuma resposta encontrada para esta pergunta.</p>';
        return;
    }

    const totalPaginas = Math.ceil(respostas.length / itensPorPagina);
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const respostasDaPagina = respostas.slice(inicio, fim);

    // Cria a tabela
    const tabela = document.createElement('table');
    tabela.className = 'tabela-gestao';

    // Cabeçalho
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>ID</th>
            <th>Sala ID</th>
            <th>Nota</th>
            <th>Data/Hora</th>
        </tr>
    `;
    tabela.appendChild(thead);

    // Corpo da tabela
    const tbody = document.createElement('tbody');
    respostasDaPagina.forEach(resposta => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${resposta.id}</td>
            <td>${resposta.sala_id}</td>
            <td>${resposta.nota}</td>
            <td>${new Date(resposta.data_hora).toLocaleString('pt-BR')}</td>
        `;
        tbody.appendChild(tr);
    });
    tabela.appendChild(tbody);
    content.appendChild(tabela);

    // Controles de paginação
    const paginacaoContainer = document.createElement('div');
    paginacaoContainer.className = 'paginacao';

    const btnAnterior = document.createElement('button');
    btnAnterior.textContent = 'Anterior';
    btnAnterior.disabled = paginaAtual === 1;
    btnAnterior.onclick = () => {
        if (paginaAtual > 1) {
            paginaAtualPorPergunta[perguntaId]--;
            renderizarRespostasDaPergunta(perguntaId);
        }
    };

    const indicadorPagina = document.createElement('span');
    indicadorPagina.textContent = `Página ${paginaAtual} de ${totalPaginas} (${respostas.length} respostas)`;

    const btnProxima = document.createElement('button');
    btnProxima.textContent = 'Próxima';
    btnProxima.disabled = paginaAtual === totalPaginas;
    btnProxima.onclick = () => {
        if (paginaAtual < totalPaginas) {
            paginaAtualPorPergunta[perguntaId]++;
            renderizarRespostasDaPergunta(perguntaId);
        }
    };

    paginacaoContainer.appendChild(btnAnterior);
    paginacaoContainer.appendChild(indicadorPagina);
    paginacaoContainer.appendChild(btnProxima);
    content.appendChild(paginacaoContainer);
}

function gerarPainelSalas() {
    // Implementar a geração do painel de salas
}

function gerarPainelGraficos() {
    // Implementar a geração do painel de gráficos
}
