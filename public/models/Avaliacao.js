export class Avaliacao {
    constructor(id_respostas, respostas, feedback = null) {
        this.id_respostas = id_respostas;
        this.respostas = respostas;
        this.feedback = feedback;
    }

    //Calcula a média das notas das respostas
    getMedia() {
        if (!this.respostas || this.respostas.length === 0) return 0;
        const soma = this.respostas.reduce((acc, r) => acc + parseFloat(r.nota), 0);
        return parseFloat((soma / this.respostas.length).toFixed(1));
    }

    //Calcula a média formatada com uma casa decimal
    getMediaFormatada() {
        return this.getMedia().toFixed(1);
    }

    //Retorna a data/hora da primeira resposta
    getDataHora() {
        if (!this.respostas || this.respostas.length === 0) return '';
        return this.respostas[0].data_hora;
    }

    //Retorna a data/hora formatada
    getDataFormatada() {
        if (!this.respostas || this.respostas.length === 0) return '';
        return this.respostas[0].getDataFormatada();
    }

    //Verifica se a avaliação tem feedback
    hasFeedback() {
        return this.feedback !== null && this.feedback.hasDescricao();
    }

    //Retorna a quantidade de respostas
    getQuantidadeRespostas() {
        return this.respostas ? this.respostas.length : 0;
    }

    //Agrupa um array de respostas por id_respostas em avaliações
    static agruparRespostasPorAvaliacao(respostas) {
        const avaliacoes = {};
        respostas.forEach(resposta => {
            if (!avaliacoes[resposta.id_respostas]) {
                avaliacoes[resposta.id_respostas] = [];
            }
            avaliacoes[resposta.id_respostas].push(resposta);
        });
        return avaliacoes;
    }

    //Cria instâncias de Avaliacao a partir de respostas agrupadas
    static fromRespostasAgrupadas(respostasAgrupadas) {
        const avaliacoes = [];
        for (let id_respostas in respostasAgrupadas) {
            avaliacoes.push(new Avaliacao(id_respostas, respostasAgrupadas[id_respostas]));
        }
        return avaliacoes;
    }
}
