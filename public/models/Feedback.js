export class Feedback {
    constructor(id, descricao, id_respostas) {
        this.id = id;
        this.descricao = descricao;
        this.id_respostas = id_respostas;
    }

    //Cria uma instância de Feedback a partir de um objeto JSON
    static fromJson(json) {
        if (!json) return null;
        return new Feedback(
            json.id || null,
            json.descricao || '',
            json.id_respostas || null
        );
    }

    //Converte uma lista de objetos JSON em uma lista de Feedbacks
    static fromJsonArray(jsonArray) {
        if (!Array.isArray(jsonArray)) return [];
        return jsonArray.map(json => Feedback.fromJson(json)).filter(f => f !== null);
    }

    //Verifica se o feedback tem descrição
    hasDescricao() {
        return this.descricao && this.descricao.trim().length > 0;
    }

    //Converte o objeto para JSON no formato da API
    toJson() {
        return {
            descricao: this.descricao,
            id_respostas: this.id_respostas
        };
    }
}