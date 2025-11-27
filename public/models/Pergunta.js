export class Pergunta {
    constructor(id, descricao, sala_id, ordem_exibicao, ativo = true) {
        this.id = id;
        this.descricao = descricao;
        this.sala_id = sala_id;
        this.ordem_exibicao = ordem_exibicao;
        this.ativo = ativo;
    }

    //Cria uma instância de Pergunta a partir de um objeto JSON
    static fromJson(json) {
        return new Pergunta(
            json.id,
            json.descricao,
            json.sala_id,
            json.ordem_exibicao,
            json.ativo !== undefined ? json.ativo : true
        );
    }

    //Converte uma lista de objetos JSON em uma lista de Perguntas
    static fromJsonArray(jsonArray) {
        if (!Array.isArray(jsonArray)) return [];
        return jsonArray.map(json => Pergunta.fromJson(json));
    }
}
