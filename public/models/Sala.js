export class Sala {
    constructor(id, descricao, ativo = true) {
        this.id = id;
        this.descricao = descricao;
        this.ativo = ativo;
    }

    //Cria uma instância de Sala a partir de um objeto JSON
    static fromJson(json) {
        return new Sala(
            json.id,
            json.descricao,
            json.ativo !== undefined ? json.ativo : true
        );
    }

    //Converte uma lista de objetos JSON em uma lista de Salas
    static fromJsonArray(jsonArray) {
        if (!Array.isArray(jsonArray)) return [];
        return jsonArray.map(json => Sala.fromJson(json));
    }
}
