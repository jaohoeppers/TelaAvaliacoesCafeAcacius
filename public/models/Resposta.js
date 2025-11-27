export class Resposta {
    constructor(id, pergunta_id, sala_id, nota, data_hora, id_respostas, ativo = true, perguntaDescricao = null, perguntaOrdem = null) {
        this.id = id;
        this.pergunta_id = pergunta_id;
        this.sala_id = sala_id;
        this.nota = nota;
        this.data_hora = data_hora;
        this.id_respostas = id_respostas;
        this.ativo = ativo;
        this.perguntaDescricao = perguntaDescricao;
        this.perguntaOrdem = perguntaOrdem;
    }

    //Cria uma instância de Resposta a partir de um objeto JSON
    static fromJson(json) {
        return new Resposta(
            json.id,
            json.pergunta_id,
            json.sala_id,
            parseInt(json.nota),
            json.data_hora,
            json.id_respostas,
            json.ativo !== undefined ? json.ativo : true,
            json.pergunta_descricao || null,
            json.pergunta_ordem || null
        );
    }

    //Converte uma lista de objetos JSON em uma lista de Respostas
    static fromJsonArray(jsonArray) {
        if (!Array.isArray(jsonArray)) return [];
        return jsonArray.map(json => Resposta.fromJson(json));
    }

    //Retorna a data formatada em português
    getDataFormatada() {
        return new Date(this.data_hora).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    //Retorna apenas a data (sem hora) formatada
    getDataISO() {
        return new Date(this.data_hora).toISOString().split('T')[0];
    }

    //Converte o objeto para JSON no formato da API
    toJson() {
        return {
            pergunta_id: this.pergunta_id,
            sala_id: this.sala_id,
            nota: this.nota,
            data_hora: this.data_hora,
            id_respostas: this.id_respostas
        };
    }
}
