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
    
    mainContent.innerHTML = `
        <h2>Visão Geral do Sistema</h2>
        
        <!-- Filtro de datas global -->
        <div class="filtro-datas-geral">
            <div class="filtro-grupo">
                <label for="dataInicialGeral">Data Inicial:</label>
                <input type="date" id="dataInicialGeral" class="input-data" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="filtro-grupo">
                <label for="dataFinalGeral">Data Final:</label>
                <input type="date" id="dataFinalGeral" class="input-data" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <button class="btn-filtrar" onclick="aplicarFiltroGeral()">Aplicar Filtro</button>
            <button class="btn-limpar-filtro" onclick="limparFiltroGeral()">Limpar Filtro</button>
        </div>
        
        <!-- Estatísticas gerais -->
        <div class="estatisticas-gerais" id="estatisticasGerais">
            <div class="loading">Carregando estatísticas...</div>
        </div>
    `;
    
    carregarEstatisticasGerais();
}

function carregarEstatisticasGerais() {
    const dataInicial = document.getElementById('dataInicialGeral')?.value;
    const dataFinal = document.getElementById('dataFinalGeral')?.value;
    
    // Busca todas as respostas e salas
    Promise.all([
        fetch('http://localhost:80/progavaliacoescafe/src/backend.php?action=get_respostas').then(r => r.json()),
        fetch('http://localhost:80/progavaliacoescafe/src/backend.php?action=get_salas').then(r => r.json())
    ])
    .then(([respostas, salas]) => {
        // Aplica filtro de data se necessário
        let respostasFiltradas = respostas;
        if (dataInicial && dataFinal) {
            respostasFiltradas = respostas.filter(r => {
                const dataResposta = new Date(r.data_hora).toISOString().split('T')[0];
                return dataResposta >= dataInicial && dataResposta <= dataFinal;
            });
        }
        
        // Calcula estatísticas
        const stats = calcularEstatisticasGerais(respostasFiltradas, salas, dataInicial, dataFinal);
        renderizarEstatisticasGerais(stats, dataInicial, dataFinal);
    })
    .catch(error => {
        console.error('Erro ao carregar estatísticas gerais:', error);
        document.getElementById('estatisticasGerais').innerHTML = '<p>Erro ao carregar estatísticas.</p>';
    });
}

function calcularEstatisticasGerais(respostas, salas, dataInicial, dataFinal) {
    const stats = {
        totalAvaliacoes: 0,
        avaliacoesPorSala: {},
        mediaPorSala: {},
        avaliacoesComFeedback: 0,
        periodo: ''
    };
    
    // Inicializa contadores por sala
    salas.forEach(sala => {
        stats.avaliacoesPorSala[sala.id] = { nome: sala.descricao, count: 0 };
        stats.mediaPorSala[sala.id] = { nome: sala.descricao, soma: 0, count: 0, media: 0 };
    });
    
    // Agrupa respostas por id_respostas para contar avaliações únicas
    const avaliacoesUnicas = new Set();
    
    respostas.forEach(r => {
        avaliacoesUnicas.add(r.id_respostas);
        
        // Conta por sala
        if (stats.avaliacoesPorSala[r.sala_id]) {
            stats.mediaPorSala[r.sala_id].soma += parseFloat(r.nota);
            stats.mediaPorSala[r.sala_id].count++;
        }
    });
    
    stats.totalAvaliacoes = avaliacoesUnicas.size;
    
    // Calcula médias
    Object.keys(stats.mediaPorSala).forEach(salaId => {
        const sala = stats.mediaPorSala[salaId];
        if (sala.count > 0) {
            sala.media = (sala.soma / sala.count).toFixed(2);
        }
    });
    
    // Conta avaliações por sala (únicas)
    respostas.forEach(r => {
        if (stats.avaliacoesPorSala[r.sala_id]) {
            if (!stats.avaliacoesPorSala[r.sala_id].ids) {
                stats.avaliacoesPorSala[r.sala_id].ids = new Set();
            }
            stats.avaliacoesPorSala[r.sala_id].ids.add(r.id_respostas);
        }
    });
    
    Object.keys(stats.avaliacoesPorSala).forEach(salaId => {
        const sala = stats.avaliacoesPorSala[salaId];
        sala.count = sala.ids ? sala.ids.size : 0;
    });
    
    // Conta apenas feedbacks das avaliações no período filtrado
    const idsRespostasFiltradas = new Set(respostas.map(r => r.id_respostas));
    
    // Busca feedbacks para contar avaliações com feedback
    fetch('http://localhost:80/progavaliacoescafe/src/backend.php?action=get_all_feedbacks')
        .then(r => r.json())
        .then(feedbacks => {
            if (feedbacks && Array.isArray(feedbacks)) {
                // Filtra apenas feedbacks cujos id_respostas estão nas respostas filtradas
                const feedbacksFiltrados = feedbacks.filter(f => idsRespostasFiltradas.has(f.id_respostas));
                stats.avaliacoesComFeedback = feedbacksFiltrados.length;
                renderizarEstatisticasGerais(stats, dataInicial, dataFinal);
            }
        })
        .catch(() => {
            // Se não conseguir buscar feedbacks, mantém 0
            stats.avaliacoesComFeedback = 0;
        });
    
    return stats;
}

function renderizarEstatisticasGerais(stats, dataInicial, dataFinal) {
    const container = document.getElementById('estatisticasGerais');
    if (!container) return;
    
    const periodo = (dataInicial && dataFinal) 
        ? `Período: ${new Date(dataInicial + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(dataFinal + 'T00:00:00').toLocaleDateString('pt-BR')}` 
        : 'Período: Todos os registros';
    
    let html = `
        <div class="periodo-info">${periodo}</div>
        
        <div class="cards-estatisticas">
            <div class="card-stat">
                <div class="card-stat-icon">📊</div>
                <div class="card-stat-info">
                    <div class="card-stat-label">Total de Avaliações</div>
                    <div class="card-stat-value">${stats.totalAvaliacoes}</div>
                </div>
            </div>
            
            <div class="card-stat">
                <div class="card-stat-icon">💬</div>
                <div class="card-stat-info">
                    <div class="card-stat-label">Avaliações com Feedback</div>
                    <div class="card-stat-value">${stats.avaliacoesComFeedback}</div>
                </div>
            </div>
        </div>
        
        <div class="secao-salas">
            <h3>Estatísticas por Sala</h3>
            <div class="tabela-salas-container">
                <table class="tabela-salas">
                    <thead>
                        <tr>
                            <th>Sala</th>
                            <th>Média de Notas</th>
                            <th>Número de Avaliações</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    Object.keys(stats.mediaPorSala).forEach(salaId => {
        const media = stats.mediaPorSala[salaId];
        const avaliacoes = stats.avaliacoesPorSala[salaId];
        const cor = getCorPorMedia(parseFloat(media.media));
        
        html += `
            <tr>
                <td><strong>${media.nome}</strong></td>
                <td>
                    <span class="badge-nota" style="background-color: ${cor}; color: white; padding: 5px 10px; border-radius: 5px; font-weight: bold;">
                        ${media.media}
                    </span>
                </td>
                <td>${avaliacoes.count}</td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function aplicarFiltroGeral() {
    const dataInicial = document.getElementById('dataInicialGeral').value;
    const dataFinal = document.getElementById('dataFinalGeral').value;
    
    if (!dataInicial || !dataFinal) {
        alert('Por favor, selecione ambas as datas para filtrar.');
        return;
    }
    
    if (dataInicial > dataFinal) {
        alert('A data inicial não pode ser maior que a data final.');
        return;
    }
    
    carregarEstatisticasGerais();
}

function limparFiltroGeral() {
    document.getElementById('dataInicialGeral').value = '';
    document.getElementById('dataFinalGeral').value = '';
    carregarEstatisticasGerais();
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
                <input type="date" id="dataInicial" class="input-data" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="filtro-grupo">
                <label for="dataFinal">Data Final:</label>
                <input type="date" id="dataFinal" class="input-data" value="${new Date().toISOString().split('T')[0]}">
            </div>
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
        
        <!-- Painel de Avaliações (terceiro painel) -->
        <div class="painel-avaliacoes-sala" id="painelAvaliacoesSala">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0;">Avaliações</h3>
                <button class="btn-recarregar-avaliacoes" onclick="recarregarAvaliacoes(${salaId})" title="Recarregar avaliações">
                    ↻ Recarregar
                </button>
            </div>
            <div class="avaliacoes-conteudo" id="avaliacoesConteudo"></div>
        </div>
    `;
    
    // Carrega as perguntas da sala
    carregarPerguntasDaSala(salaId);
    
    // Carrega as estatísticas da sala
    carregarEstatisticasDaSala(salaId);
    
    // Carrega as avaliações da sala
    carregarAvaliacoesDaSala(salaId);
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

function recarregarAvaliacoes(salaId) {
    console.log(`Recarregando avaliações da sala ${salaId}`);
    carregarAvaliacoesDaSala(salaId);
}

// ========================================
// ESTATÍSTICAS DA SALA
// ========================================

function carregarEstatisticasDaSala(salaId) {
    fetch(`http://localhost:80/progavaliacoescafe/src/backend.php?action=get_perguntas&sala_id=${salaId}`)
        .then(response => response.json())
        .then(perguntas => {
            renderizarEstatisticasGrid(perguntas, salaId);
        })
        .catch(error => {
            console.error('Erro ao carregar estatísticas da sala:', error);
            const conteudo = document.getElementById('estatisticasConteudo');
            if (conteudo) {
                conteudo.innerHTML = '<p>Erro ao carregar as estatísticas.</p>';
            }
        });
}

function renderizarEstatisticasGrid(perguntas, salaId) {
    const conteudo = document.getElementById('estatisticasConteudo');
    if (!conteudo) return;
    
    conteudo.innerHTML = '';
    
    if (perguntas.length === 0) {
        conteudo.innerHTML = '<p>Nenhuma pergunta encontrada para gerar estatísticas.</p>';
        return;
    }
    
    // Cria grid de perguntas para estatísticas
    const grid = document.createElement('div');
    grid.className = 'perguntas-grid';
    grid.id = 'estatisticasGrid';
    
    perguntas.forEach(pergunta => {
        const card = document.createElement('div');
        card.className = 'pergunta-card estatistica-card';
        card.innerHTML = `
            <div class="pergunta-id">#${pergunta.id}</div>
            <div class="pergunta-descricao">${pergunta.descricao}</div>
        `;
        card.onclick = () => abrirGraficoPergunta(pergunta.id, pergunta.descricao);
        grid.appendChild(card);
    });
    
    conteudo.appendChild(grid);
}

function abrirGraficoPergunta(perguntaId, perguntaDescricao) {
    // Obtém os valores do filtro de data
    const dataInicial = document.getElementById('dataInicial')?.value;
    const dataFinal = document.getElementById('dataFinal')?.value;
    
    // Busca as respostas da pergunta
    fetch(`http://localhost:80/progavaliacoescafe/src/backend.php?action=get_respostas_por_pergunta&pergunta_id=${perguntaId}`)
        .then(response => response.json())
        .then(respostas => {
            if (respostas.length === 0) {
                alert('Nenhuma resposta encontrada para esta pergunta.');
                return;
            }
            
            // Aplica o filtro de data se ambas as datas estiverem preenchidas
            let respostasFiltradas = respostas;
            if (dataInicial && dataFinal) {
                respostasFiltradas = respostas.filter(resposta => {
                    const dataResposta = new Date(resposta.data_hora).toISOString().split('T')[0];
                    return dataResposta >= dataInicial && dataResposta <= dataFinal;
                });
                
                if (respostasFiltradas.length === 0) {
                    alert('Nenhuma resposta encontrada no período selecionado.');
                    return;
                }
            }
            
            // Processa as notas e gera o gráfico
            gerarGraficoPizza(perguntaId, perguntaDescricao, respostasFiltradas, dataInicial, dataFinal);
        })
        .catch(error => {
            console.error('Erro ao buscar respostas:', error);
            alert('Erro ao carregar dados para o gráfico.');
        });
}

function gerarGraficoPizza(perguntaId, perguntaDescricao, respostas, dataInicial, dataFinal) {
    // Conta as ocorrências de cada nota (0-10)
    const contagemNotas = {};
    for (let i = 0; i <= 10; i++) {
        contagemNotas[i] = 0;
    }
    
    respostas.forEach(resposta => {
        const nota = parseInt(resposta.nota);
        if (nota >= 0 && nota <= 10) {
            contagemNotas[nota]++;
        }
    });
    
    // Remove notas com contagem zero
    const dadosGrafico = [];
    for (let nota in contagemNotas) {
        if (contagemNotas[nota] > 0) {
            dadosGrafico.push({
                nota: parseInt(nota),
                quantidade: contagemNotas[nota],
                percentual: ((contagemNotas[nota] / respostas.length) * 100).toFixed(1)
            });
        }
    }
    
    // Cria o overlay com o gráfico
    criarOverlayGrafico(perguntaId, perguntaDescricao, dadosGrafico, respostas.length, dataInicial, dataFinal);
}

function criarOverlayGrafico(perguntaId, perguntaDescricao, dadosGrafico, totalRespostas, dataInicial, dataFinal) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay-grafico';
    
    // Cores conforme a escala da imagem (Improvável 0 -> Muito Provável 10)
    const cores = [
        '#FF0000', // 0 - Vermelho (Improvável)
        '#CC0000', // 1 - Vermelho escuro
        '#FF4500', // 2 - Laranja avermelhado
        '#FF8C00', // 3 - Laranja
        '#FFA500', // 4 - Laranja claro
        '#FFD700', // 5 - Amarelo ouro
        '#FFFF00', // 6 - Amarelo
        '#ADFF2F', // 7 - Verde amarelado
        '#9ACD32', // 8 - Verde claro
        '#7CFC00', // 9 - Verde
        '#32CD32'  // 10 - Verde (Muito Provável)
    ];
    
    // Se houver apenas uma nota, desenha um círculo completo
    const raio = 120;
    const centroX = 150;
    const centroY = 150;
    
    let segmentosSVG = '';
    
    if (dadosGrafico.length === 1) {
        // Desenha um círculo completo
        const item = dadosGrafico[0];
        segmentosSVG = `
            <circle cx="${centroX}" cy="${centroY}" r="${raio}" 
                    fill="${cores[item.nota]}" 
                    stroke="white" 
                    stroke-width="2"
                    class="grafico-segmento">
                <title>Nota ${item.nota}: ${item.quantidade} respostas (${item.percentual}%)</title>
            </circle>
        `;
    } else {
        // Desenha segmentos normalmente
        let anguloInicial = 0;
        dadosGrafico.forEach(item => {
            const angulo = (item.quantidade / totalRespostas) * 360;
            const anguloFinal = anguloInicial + angulo;
            
            const x1 = centroX + raio * Math.cos((anguloInicial - 90) * Math.PI / 180);
            const y1 = centroY + raio * Math.sin((anguloInicial - 90) * Math.PI / 180);
            const x2 = centroX + raio * Math.cos((anguloFinal - 90) * Math.PI / 180);
            const y2 = centroY + raio * Math.sin((anguloFinal - 90) * Math.PI / 180);
            
            const largeArc = angulo > 180 ? 1 : 0;
            
            segmentosSVG += `
                <path d="M ${centroX} ${centroY} L ${x1} ${y1} A ${raio} ${raio} 0 ${largeArc} 1 ${x2} ${y2} Z" 
                      fill="${cores[item.nota]}" 
                      stroke="white" 
                      stroke-width="2"
                      class="grafico-segmento"
                      data-nota="${item.nota}"
                      data-qtd="${item.quantidade}"
                      data-perc="${item.percentual}">
                    <title>Nota ${item.nota}: ${item.quantidade} respostas (${item.percentual}%)</title>
                </path>
            `;
            
            anguloInicial = anguloFinal;
        });
    }
    
    // Cria a legenda
    let legendaHTML = '';
    dadosGrafico.forEach(item => {
        legendaHTML += `
            <div class="legenda-item">
                <span class="legenda-cor" style="background-color: ${cores[item.nota]}"></span>
                <span class="legenda-texto">Nota ${item.nota}: ${item.quantidade} (${item.percentual}%)</span>
            </div>
        `;
    });
    
    // Texto do período filtrado
    let periodoTexto = '';
    if (dataInicial && dataFinal) {
        const dataInicialFormatada = new Date(dataInicial + 'T00:00:00').toLocaleDateString('pt-BR');
        const dataFinalFormatada = new Date(dataFinal + 'T00:00:00').toLocaleDateString('pt-BR');
        periodoTexto = `<p class="grafico-periodo">Período: ${dataInicialFormatada} a ${dataFinalFormatada}</p>`;
    }
    
    overlay.innerHTML = `
        <div class="overlay-grafico-conteudo">
            <div class="overlay-grafico-header">
                <h3>Estatísticas - Pergunta #${perguntaId}</h3>
                <button class="btn-fechar-overlay" onclick="fecharOverlayGrafico()">&times;</button>
            </div>
            <div class="overlay-grafico-body">
                <p class="grafico-descricao">${perguntaDescricao}</p>
                ${periodoTexto}
                <p class="grafico-total">Total de respostas: <strong>${totalRespostas}</strong></p>
                
                <div class="grafico-container">
                    <svg width="300" height="300" viewBox="0 0 300 300">
                        ${segmentosSVG}
                    </svg>
                </div>
                
                <div class="grafico-legenda">
                    ${legendaHTML}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

function fecharOverlayGrafico() {
    const overlay = document.querySelector('.overlay-grafico');
    if (overlay) {
        overlay.remove();
    }
}

// ========================================
// AVALIAÇÕES DA SALA
// ========================================

function carregarAvaliacoesDaSala(salaId) {
    fetch(`http://localhost:80/progavaliacoescafe/src/backend.php?action=get_respostas&sala_id=${salaId}`)
        .then(response => response.json())
        .then(respostas => {
            if (respostas.length === 0) {
                document.getElementById('avaliacoesConteudo').innerHTML = '<p>Nenhuma avaliação encontrada.</p>';
                return;
            }
            
            // Obtém os valores do filtro de data
            const dataInicial = document.getElementById('dataInicial')?.value;
            const dataFinal = document.getElementById('dataFinal')?.value;
            
            // Aplica o filtro de data se ambas as datas estiverem preenchidas
            let respostasFiltradas = respostas;
            if (dataInicial && dataFinal) {
                respostasFiltradas = respostas.filter(resposta => {
                    const dataResposta = new Date(resposta.data_hora).toISOString().split('T')[0];
                    return dataResposta >= dataInicial && dataResposta <= dataFinal;
                });
                
                if (respostasFiltradas.length === 0) {
                    document.getElementById('avaliacoesConteudo').innerHTML = '<p>Nenhuma avaliação encontrada no período selecionado.</p>';
                    return;
                }
            }
            
            // Agrupa respostas por id_respostas
            const avaliacoes = {};
            respostasFiltradas.forEach(resposta => {
                if (!avaliacoes[resposta.id_respostas]) {
                    avaliacoes[resposta.id_respostas] = [];
                }
                avaliacoes[resposta.id_respostas].push(resposta);
            });
            
            renderizarAvaliacoesGrid(avaliacoes, salaId);
        })
        .catch(error => {
            console.error('Erro ao carregar avaliações:', error);
            document.getElementById('avaliacoesConteudo').innerHTML = '<p>Erro ao carregar avaliações.</p>';
        });
}

function renderizarAvaliacoesGrid(avaliacoes, salaId) {
    const conteudo = document.getElementById('avaliacoesConteudo');
    if (!conteudo) return;
    
    conteudo.innerHTML = '';
    
    const grid = document.createElement('div');
    grid.className = 'avaliacoes-grid';
    
    let numeroAvaliacao = 1;
    for (let idAvaliacao in avaliacoes) {
        const respostas = avaliacoes[idAvaliacao];
        
        // Calcula a média
        const somaNotas = respostas.reduce((sum, r) => sum + parseInt(r.nota), 0);
        const media = (somaNotas / respostas.length).toFixed(1);
        
        // Define a cor baseada na média
        const corMedia = getCorPorMedia(parseFloat(media));
        
        const card = document.createElement('div');
        card.className = 'avaliacao-card';
        card.style.borderColor = corMedia;
        card.innerHTML = `
            <div class="avaliacao-header" style="background-color: ${corMedia}">
                <span class="avaliacao-numero">Avaliação ${numeroAvaliacao}</span>
            </div>
            <div class="avaliacao-body">
                <div class="avaliacao-media">Média: <strong>${media}</strong></div>
                <div class="avaliacao-data">${new Date(respostas[0].data_hora).toLocaleString('pt-BR')}</div>
            </div>
        `;
        card.onclick = () => abrirDetalhesAvaliacao(idAvaliacao, numeroAvaliacao, respostas, media);
        grid.appendChild(card);
        numeroAvaliacao++;
    }
    
    conteudo.appendChild(grid);
}

function getCorPorMedia(media) {
    // Cores conforme a escala da imagem (0 = vermelho, 10 = verde)
    if (media <= 1) return '#FF0000'; // 0-1: Vermelho
    if (media <= 2) return '#FF4500'; // 2: Laranja avermelhado
    if (media <= 3) return '#FF8C00'; // 3: Laranja
    if (media <= 4) return '#FFA500'; // 4: Laranja claro
    if (media <= 5) return '#FFD700'; // 5: Amarelo ouro
    if (media <= 6) return '#FFFF00'; // 6: Amarelo
    if (media <= 7) return '#ADFF2F'; // 7: Verde amarelado
    if (media <= 8) return '#9ACD32'; // 8: Verde claro
    if (media <= 9) return '#7CFC00'; // 9: Verde
    return '#32CD32'; // 10: Verde
}

function abrirDetalhesAvaliacao(idAvaliacao, numeroAvaliacao, respostas, media) {
    // Busca o feedback se existir
    fetch(`http://localhost:80/progavaliacoescafe/src/backend.php?action=get_feedback&id_respostas=${idAvaliacao}`)
        .then(response => response.json())
        .then(feedback => {
            mostrarOverlayAvaliacao(idAvaliacao, numeroAvaliacao, respostas, media, feedback);
        })
        .catch(error => {
            console.error('Erro ao buscar feedback:', error);
            mostrarOverlayAvaliacao(idAvaliacao, numeroAvaliacao, respostas, media, null);
        });
}

function mostrarOverlayAvaliacao(idAvaliacao, numeroAvaliacao, respostas, media, feedback) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay-avaliacao';
    
    const corMedia = getCorPorMedia(parseFloat(media));
    
    // Organiza respostas por pergunta
    let respostasHTML = '';
    respostas.forEach(resposta => {
        respostasHTML += `
            <div class="resposta-item">
                <span class="resposta-pergunta">Pergunta #${resposta.pergunta_id}</span>
                <span class="resposta-nota" style="background-color: ${getCorPorMedia(resposta.nota)}">
                    Nota: ${resposta.nota}
                </span>
            </div>
        `;
    });
    
    // Feedback
    let feedbackHTML = '';
    if (feedback && feedback.descricao) {
        feedbackHTML = `
            <div class="avaliacao-feedback">
                <h4>Feedback do Cliente</h4>
                <p>${feedback.descricao}</p>
            </div>
        `;
    }
    
    overlay.innerHTML = `
        <div class="overlay-avaliacao-conteudo">
            <div class="overlay-avaliacao-header" style="background-color: ${corMedia}">
                <h3>Avaliação ${numeroAvaliacao}</h3>
                <button class="btn-fechar-overlay" onclick="fecharOverlayAvaliacao()">&times;</button>
            </div>
            <div class="overlay-avaliacao-body">
                <div class="avaliacao-info">
                    <p class="avaliacao-media-destaque">Média: <strong style="color: ${corMedia}">${media}</strong></p>
                    <p class="avaliacao-data-completa">${new Date(respostas[0].data_hora).toLocaleString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    })}</p>
                </div>
                
                ${feedbackHTML}
                
                <div class="avaliacao-respostas">
                    <h4>Todas as Respostas</h4>
                    ${respostasHTML}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

function fecharOverlayAvaliacao() {
    const overlay = document.querySelector('.overlay-avaliacao');
    if (overlay) {
        overlay.remove();
    }
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