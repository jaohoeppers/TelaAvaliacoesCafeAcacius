// ========================================
// FUNÇÕES PARA GERAR TELAS E PAINÉIS DA GESTÃO
// ========================================

// Variáveis globais para controle de paginação
let todasAsRespostas = [];
let paginaAtualRespostas = 1;
let respostasPorPergunta = {};
let paginaAtualPorPergunta = {};

// ========================================
// TELA GERAL
// ========================================

function gerarTelaGeral() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    mainContent.innerHTML = '<h2>Visão Geral</h2>';
    gerarPainelRespostas();
    gerarPainelPerguntas();
}

function gerarPainelRespostas() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    fetch(`http://localhost:80/progavaliacoescafe/src/backend.php?action=get_respostas`)
        .then(response => response.json())
        .then(data => {
            todasAsRespostas = data;
            paginaAtualRespostas = 1;
            const painelDiv = document.createElement('div');
            painelDiv.id = 'painelRespostas';
            mainContent.appendChild(painelDiv);
            renderizarPaginaDeRespostas();
        })
        .catch(error => {
            console.error('Erro ao obter respostas:', error);
            const painelDiv = document.createElement('div');
            painelDiv.innerHTML = '<p>Erro ao carregar as respostas.</p>';
            mainContent.appendChild(painelDiv);
        });
}

function renderizarPaginaDeRespostas() {
    const itensPorPagina = 100;
    const listaRespostas = document.getElementById('painelRespostas');
    if (!listaRespostas) return;

    listaRespostas.innerHTML = '';

    const totalPaginas = Math.ceil(todasAsRespostas.length / itensPorPagina);
    const inicio = (paginaAtualRespostas - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const respostasDaPagina = todasAsRespostas.slice(inicio, fim);

    const tabela = document.createElement('table');
    tabela.className = 'tabela-gestao';

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

function gerarPainelPerguntas() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    const painelPerguntas = document.createElement('div');
    painelPerguntas.id = 'painelPerguntas';
    painelPerguntas.innerHTML = '<h2>Perguntas e Respostas</h2>';
    mainContent.appendChild(painelPerguntas);

    fetch(`http://localhost:80/progavaliacoescafe/src/backend.php?action=get_todas_perguntas`)
        .then(response => response.json())
        .then(perguntas => {
            const accordion = document.createElement('div');
            accordion.className = 'accordion-perguntas';

            perguntas.forEach(pergunta => {
                const item = document.createElement('div');
                item.className = 'accordion-item';

                const header = document.createElement('div');
                header.className = 'accordion-header';
                header.innerHTML = `
                    <span class="pergunta-texto">Pergunta ${pergunta.id}: ${pergunta.descricao}</span>
                    <span class="arrow">▼</span>
                `;
                header.onclick = () => togglePergunta(pergunta.id, header);

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
        content.style.display = 'block';
        arrow.textContent = '▲';

        if (!respostasPorPergunta[perguntaId]) {
            carregarRespostasDaPergunta(perguntaId);
        }
    } else {
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

    content.innerHTML = '';

    if (respostas.length === 0) {
        content.innerHTML = '<p>Nenhuma resposta encontrada para esta pergunta.</p>';
        return;
    }

    const totalPaginas = Math.ceil(respostas.length / itensPorPagina);
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const respostasDaPagina = respostas.slice(inicio, fim);

    const tabela = document.createElement('table');
    tabela.className = 'tabela-gestao';

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

// ========================================
// TELA SALAS
// ========================================

function gerarTelaSalas() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    // Salva o estado da tela
    salvarEstadoTela('salas', {});
    
    mainContent.innerHTML = '<h2>Gestão de Salas</h2>';
    
    // Busca todas as salas
    fetch(`http://localhost:80/progavaliacoescafe/src/backend.php?action=get_salas`)
        .then(response => response.json())
        .then(salas => {
            const containerBotoes = document.createElement('div');
            containerBotoes.className = 'salas-grid';
            
            salas.forEach(sala => {
                const botaoSala = document.createElement('button');
                botaoSala.className = 'sala-card';
                botaoSala.innerHTML = `
                    <span class="sala-icon">🏠</span>
                    <span class="sala-nome">${sala.descricao}</span>
                `;
                botaoSala.onclick = () => abrirDetalhesSala(sala.id, sala.descricao);
                containerBotoes.appendChild(botaoSala);
            });
            
            mainContent.appendChild(containerBotoes);
        })
        .catch(error => {
            console.error('Erro ao obter salas:', error);
            mainContent.innerHTML += '<p>Erro ao carregar as salas.</p>';
        });
}

function abrirDetalhesSala(salaId, salaNome) {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    // Salva o estado da tela
    salvarEstadoTela('detalhesSala', { salaId, salaNome });
    
    mainContent.innerHTML = `
        <div class="sala-header">
            <button class="btn-voltar" onclick="gerarTelaSalas()">← Voltar</button>
            <h2>Detalhes da Sala: ${salaNome}</h2>
        </div>
        
        <!-- Filtro de datas -->
        <div class="filtro-datas">
            <div class="filtro-grupo">
                <label for="dataInicial">Data Inicial:</label>
                <input type="date" id="dataInicial" class="input-data">
            </div>
            <div class="filtro-grupo">
                <label for="dataFinal">Data Final:</label>
                <input type="date" id="dataFinal" class="input-data">
            </div>
            <button class="btn-filtrar" onclick="aplicarFiltroData(${salaId})">Filtrar</button>
            <button class="btn-limpar-filtro" onclick="limparFiltroData(${salaId})">Limpar Filtro</button>
        </div>
        
        <!-- Painel de Perguntas -->
        <div class="painel-perguntas-sala" id="painelPerguntasSala">
            <h3>Perguntas da Sala</h3>
            <div class="perguntas-grid" id="perguntasGrid"></div>
        </div>
        
        <!-- Painel de Estatísticas (segundo painel) -->
        <div class="painel-estatisticas-sala" id="painelEstatisticasSala">
            <h3>Estatísticas</h3>
            <div class="estatisticas-conteudo" id="estatisticasConteudo"></div>
        </div>
    `;
    
    // Carrega as perguntas da sala
    carregarPerguntasDaSala(salaId);
}

function carregarPerguntasDaSala(salaId) {
    fetch(`http://localhost:80/progavaliacoescafe/src/backend.php?action=get_perguntas&sala_id=${salaId}`)
        .then(response => response.json())
        .then(perguntas => {
            renderizarPerguntasGrid(perguntas, salaId);
        })
        .catch(error => {
            console.error('Erro ao carregar perguntas da sala:', error);
            const grid = document.getElementById('perguntasGrid');
            if (grid) {
                grid.innerHTML = '<p>Erro ao carregar as perguntas.</p>';
            }
        });
}

function renderizarPerguntasGrid(perguntas, salaId) {
    const grid = document.getElementById('perguntasGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (perguntas.length === 0) {
        grid.innerHTML = '<p>Nenhuma pergunta encontrada para esta sala.</p>';
    } else {
        perguntas.forEach(pergunta => {
            const card = document.createElement('div');
            card.className = 'pergunta-card';
            card.innerHTML = `
                <div class="pergunta-id">#${pergunta.id}</div>
                <div class="pergunta-descricao">${pergunta.descricao}</div>
            `;
            card.onclick = () => abrirOverlayPergunta(pergunta);
            grid.appendChild(card);
        });
    }
    
    // Card para adicionar nova pergunta
    const cardNovo = document.createElement('div');
    cardNovo.className = 'pergunta-card pergunta-card-novo';
    cardNovo.innerHTML = `
        <div class="pergunta-add-icon">+</div>
        <div class="pergunta-add-texto">Nova Pergunta</div>
    `;
    cardNovo.onclick = () => abrirOverlayNovaPergunta(salaId);
    grid.appendChild(cardNovo);
}

function aplicarFiltroData(salaId) {
    const dataInicial = document.getElementById('dataInicial').value;
    const dataFinal = document.getElementById('dataFinal').value;
    
    if (!dataInicial || !dataFinal) {
        alert('Por favor, selecione ambas as datas para filtrar.');
        return;
    }
    
    if (dataInicial > dataFinal) {
        alert('A data inicial não pode ser maior que a data final.');
        return;
    }
    
    console.log(`Filtrando dados da sala ${salaId} de ${dataInicial} até ${dataFinal}`);
    // Aqui você pode adicionar lógica para filtrar estatísticas por data
    // Por exemplo, recarregar as estatísticas com os parâmetros de data
}

function limparFiltroData(salaId) {
    document.getElementById('dataInicial').value = '';
    document.getElementById('dataFinal').value = '';
    console.log(`Filtro de data limpo para sala ${salaId}`);
    // Recarrega os dados sem filtro
}

// Função para recarregar apenas as perguntas da sala atual
function recarregarPerguntasSala() {
    const estado = localStorage.getItem('estadoTela');
    
    if (estado) {
        try {
            const { tipo, dados } = JSON.parse(estado);
            
            if (tipo === 'detalhesSala' && dados.salaId) {
                // Recarrega apenas as perguntas sem mudar o estado
                carregarPerguntasDaSala(dados.salaId);
            }
        } catch (error) {
            console.error('Erro ao recarregar perguntas da sala:', error);
        }
    }
}

// ========================================
// OVERLAY DE PERGUNTA
// ========================================

function abrirOverlayPergunta(pergunta) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay-pergunta';
    overlay.innerHTML = `
        <div class="overlay-conteudo">
            <div class="overlay-header">
                <h3>Pergunta #${pergunta.id}</h3>
                <button class="btn-fechar-overlay" onclick="fecharOverlayPergunta()">&times;</button>
            </div>
            <div class="overlay-body">
                <label for="descricaoPergunta">Descrição:</label>
                <textarea id="descricaoPergunta" class="textarea-descricao" readonly>${pergunta.descricao}</textarea>
            </div>
            <div class="overlay-footer">
                <button class="btn-editar" onclick="habilitarEdicaoPergunta(${pergunta.id})">✏️ Editar</button>
                <button class="btn-salvar" id="btnSalvarPergunta" style="display: none;" onclick="salvarEdicaoPergunta(${pergunta.id})">💾 Salvar</button>
                <button class="btn-cancelar" id="btnCancelarPergunta" style="display: none;" onclick="cancelarEdicaoPergunta('${pergunta.descricao}')">❌ Cancelar</button>
                <button class="btn-excluir" onclick="excluirPergunta(${pergunta.id})">🗑️ Excluir</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function fecharOverlayPergunta() {
    const overlay = document.querySelector('.overlay-pergunta');
    if (overlay) {
        overlay.remove();
    }
}

function habilitarEdicaoPergunta(perguntaId) {
    const textarea = document.getElementById('descricaoPergunta');
    const btnEditar = document.querySelector('.btn-editar');
    const btnSalvar = document.getElementById('btnSalvarPergunta');
    const btnCancelar = document.getElementById('btnCancelarPergunta');
    
    textarea.readOnly = false;
    textarea.focus();
    btnEditar.style.display = 'none';
    btnSalvar.style.display = 'inline-block';
    btnCancelar.style.display = 'inline-block';
}

function cancelarEdicaoPergunta(descricaoOriginal) {
    const textarea = document.getElementById('descricaoPergunta');
    const btnEditar = document.querySelector('.btn-editar');
    const btnSalvar = document.getElementById('btnSalvarPergunta');
    const btnCancelar = document.getElementById('btnCancelarPergunta');
    
    textarea.value = descricaoOriginal;
    textarea.readOnly = true;
    btnEditar.style.display = 'inline-block';
    btnSalvar.style.display = 'none';
    btnCancelar.style.display = 'none';
}

function salvarEdicaoPergunta(perguntaId) {
    const textarea = document.getElementById('descricaoPergunta');
    const novaDescricao = textarea.value.trim();
    
    if (!novaDescricao) {
        alert('A descrição da pergunta não pode estar vazia.');
        return;
    }
    
    fetch('http://localhost:80/progavaliacoescafe/src/backend.php?action=editar_pergunta', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: perguntaId,
            descricao: novaDescricao
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Pergunta atualizada com sucesso!');
            fecharOverlayPergunta();
            // Recarrega apenas a lista de perguntas da sala atual
            recarregarPerguntasSala();
        } else {
            alert('Erro ao atualizar pergunta: ' + (data.error || 'Erro desconhecido'));
        }
    })
    .catch(error => {
        console.error('Erro ao salvar pergunta:', error);
        alert('Erro ao salvar pergunta.');
    });
}

function excluirPergunta(perguntaId) {
    if (!confirm('Tem certeza que deseja excluir esta pergunta? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    fetch('http://localhost:80/progavaliacoescafe/src/backend.php?action=excluir_pergunta', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: perguntaId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Pergunta excluída com sucesso!');
            fecharOverlayPergunta();
            // Recarrega apenas a lista de perguntas da sala atual
            recarregarPerguntasSala();
        } else {
            alert('Erro ao excluir pergunta: ' + (data.error || 'Erro desconhecido'));
        }
    })
    .catch(error => {
        console.error('Erro ao excluir pergunta:', error);
        alert('Erro ao excluir pergunta.');
    });
}

function abrirOverlayNovaPergunta(salaId) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay-pergunta';
    overlay.innerHTML = `
        <div class="overlay-conteudo">
            <div class="overlay-header">
                <h3>Nova Pergunta</h3>
                <button class="btn-fechar-overlay" onclick="fecharOverlayPergunta()">&times;</button>
            </div>
            <div class="overlay-body">
                <label for="descricaoNovaPergunta">Descrição:</label>
                <textarea id="descricaoNovaPergunta" class="textarea-descricao" placeholder="Digite a descrição da pergunta..."></textarea>
            </div>
            <div class="overlay-footer">
                <button class="btn-salvar" onclick="criarNovaPergunta(${salaId})">💾 Criar Pergunta</button>
                <button class="btn-cancelar" onclick="fecharOverlayPergunta()">❌ Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Foca no textarea
    setTimeout(() => {
        document.getElementById('descricaoNovaPergunta').focus();
    }, 100);
}

function criarNovaPergunta(salaId) {
    const textarea = document.getElementById('descricaoNovaPergunta');
    const descricao = textarea.value.trim();
    
    if (!descricao) {
        alert('A descrição da pergunta não pode estar vazia.');
        return;
    }
    
    fetch('http://localhost:80/progavaliacoescafe/src/backend.php?action=criar_pergunta', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sala_id: salaId,
            descricao: descricao
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Pergunta criada com sucesso!');
            fecharOverlayPergunta();
            // Recarrega apenas a lista de perguntas da sala atual
            recarregarPerguntasSala();
        } else {
            alert('Erro ao criar pergunta: ' + (data.error || 'Erro desconhecido'));
        }
    })
    .catch(error => {
        console.error('Erro ao criar pergunta:', error);
        alert('Erro ao criar pergunta.');
    });
}