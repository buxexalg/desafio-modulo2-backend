const Koa = require('koa');
const bodyparser = require('koa-bodyparser');

const server = new Koa();

server.use(bodyparser());

const sucessoRequisicao = (ctx,  conteudo, codigoREST = 200) => {
    ctx.status = codigoREST;
    ctx.body = {
        status: 'sucesso',
        dados: conteudo,
    }
}

const falhaRequisicao = (ctx, mensagem, codigoREST = 404) => {
    ctx.status = codigoREST;
    ctx.body = {
        status:  'erro',
        dados: {
            mensagem: mensagem
        }
    }
}

const produtos = [];
const pedidos = [];

const criarProduto = (ctx) => {
    const pedidoJSON = ctx.request.body;
    if (!pedidoJSON.nome) {
        falhaRequisicao(ctx, 'Insira corretamente todos os dados necessários.', 400);
        return false;
    } else if (!pedidoJSON.quantidade || pedidoJSON.quantidade < 0) {
        falhaRequisicao(ctx, 'Insira corretamente todos os dados necessários.', 400);
        return false;
    } else if (!pedidoJSON.valor || pedidoJSON.valor < 0) {
        falhaRequisicao(ctx, 'Insira corretamente todos os dados necessários.', 400);
        return false;
    } 

    let idProduto = 0;

    (produtos.length === 0) ? idProduto = 1 : idProduto = produtos[produtos.length - 1].id + 1;

    const novoProduto = {
        id: idProduto,
        nome: pedidoJSON.nome,
        quantidade: pedidoJSON.quantidade,
        valor: pedidoJSON.valor,
        descrição: (pedidoJSON.valor) ? pedidoJSON.valor : '',
        peso: (pedidoJSON.peso) ? pedidoJSON.peso : null,
        deletado: false
    }
    produtos.push(novoProduto);
    return novoProduto;
}

const consultaProduto = (id, ctx) => {
    for (let produto of produtos) {
        if (produto.id == id) return produto;

    }
    falhaRequisicao(ctx, 'Produto não encontrado.', 404);
    return false;
}

const listarProdutos = () => {
    return produtos;
}

const atualizaProduto = (id, ctx) => {
    const produtoJSON = ctx.request.body;
    if (produtoJSON.id) {
        falhaRequisicao(ctx, 'Não é possível alterar o ID do produto.', 403);
        return false;
    } else if (!produtoJSON.nome) {
        falhaRequisicao(ctx, 'Insira corretamente todos os dados necessários.', 400);
        return false;
    } else if (!produtoJSON.quantidade || produtoJSON.quantidade < 0) {
        falhaRequisicao(ctx, 'Insira corretamente todos os dados necessários.', 400);
        return false;
    } else if (!produtoJSON.valor || produtoJSON.valor < 0) {
        falhaRequisicao(ctx, 'Insira corretamente todos os dados necessários.', 400);
        return false;
    } 

    

    const produtoAAlterar = consultaProduto(id, ctx);

    if (!produtoAAlterar) {
        falhaRequisicao(ctx, 'Produto não encontrado.', 404);
        return false;
    } else if (produtoAAlterar.deletado) {
        falhaRequisicao(ctx, 'Não é possível alterar um produto deletado.', 403);
        return false;
    } else {
        const indexProduto = produtos.indexOf(produtoAAlterar);

        produtos[indexProduto] = {
            id: produtos[indexProduto].id,
            nome: produtoJSON.nome,
            quantidade: produtoJSON.quantidade,
            valor: produtoJSON.valor,
            descrição: (produtoJSON.valor) ? produtoJSON.valor : produtos[indexProduto]["descrição"],
            peso: (produtoJSON.peso) ? produtoJSON.peso : produtos[indexProduto].peso,
            deletado: produtos[indexProduto].deletado
        }

        return produtos[indexProduto];
    }
}


const deletaProduto = (id, ctx) => {
    const produtoADeletar = consultaProduto(id, ctx);

    if (!produtoADeletar) {
        falhaRequisicao(ctx, 'Produto não encontrado.', 404);
        return false;
    } else {
        const indexProduto = produtos.indexOf(produtoADeletar);

        produtos[indexProduto].deletado = true;

        return produtos[indexProduto];
    }
}

const alteraQuantidade = (id, quantidade, ctx) => {
    const produtoEscolhido = consultaProduto(id, ctx);

    if (!produtoADeletar) {
        falhaRequisicao(ctx, 'Produto não encontrado.', 404);
        return false;
    } else {
        if (quantidade < 0) {
            if (produtoEscolhido.quantidade === 0) {
                falhaRequisicao(ctx, 'Não é possível reduzir a quantidade de um produto sem estoque.', 403);
                return false;
            } else if ((produtoEscolhido.quantidade + quantidade) < 0) {
                falhaRequisicao(ctx, 'Não é possível adicionar mais produtos que o estoque disponível.', 403);
                return false;
            } else {
                produtoEscolhido.quantidade -= quantidade;
                return produtoEscolhido;
            }
        } else if (quantidade > 0) {
            produtoEscolhido.quantidade++;
            return produtoEscolhido;
        } else {
            falhaRequisicao(ctx, 'Insira corretamente o comando. 0 para reduzir e 1 para incrementar a quantidade', 400);
            return false; 
        }
    }    
}

server.use((ctx) => {
    const path = ctx.url;
    const method = ctx.method;
    const subPath = path.split('/');

    if (path === "/products"){
        switch (method) {
            case 'POST':
                const produtoCriado = criarProduto(ctx);

                if (produtoCriado) {
                    sucessoRequisicao(ctx, produtoCriado, 201);
                }
                break;

            case 'GET':
                sucessoRequisicao(ctx, listarProdutos(), 200);
                break;
            default:
                falhaRequisicao(ctx, 'Método não permitido' , 405);
                break;
        }
    } else 
    if (path.includes('products')){
        if (subPath[1] === "products") {
            if (subPath[2]) {
                switch (method) {
                    case 'GET':
                        consultaProduto(subPath[2], ctx) ? sucessoRequisicao(ctx, consultaProduto(subPath[2], ctx), 200) : falhaRequisicao(ctx, 'ID não encontrado.', 404);
                        break;
                    case 'PUT':
                        const produtoAtualizado = atualizaProduto(subPath[2], ctx);
                        if (produtoAtualizado) sucessoRequisicao(ctx, produtoAtualizado, 200)
                        break;
                    case 'DELETE':
                        const produtoDeletado = deletaProduto(subPath[2], ctx);
                        produtoDeletado ? sucessoRequisicao(ctx, produtoDeletado, 200) : falhaRequisicao() 
                        break;
                    default:
                        falhaRequisicao(ctx, 'Método não permitido' , 405);
                        break;   
                }
            } else {
                falhaRequisicao(ctx, 'Não encontrado.' , 404);
            }
        } else {
            falhaRequisicao(ctx, 'Não encontrado.' , 404);
        }
    }
})

server.listen(8081, () => console.log("Rodando na porta 8081"))

/* Criar novo produto	            POST /products
Obter informações de um produto	    GET /products/:id
Obter todos os produtos	            GET /products
Atualizar um produto	            PUT /products/:id
Deletar um produto	                DELETE /products/:id */

/* {
    id : number ou string
    nome* : string
    quantidade* : number | Quando for adicionado, retirado ou alterado o numero no pedido, qtd tem que mudar 
    | Se for igual a 0 não deve ser possível adicionar a um pedido 
    | Não é possível adicionar uma quantidade maior a disponivel
    valor* : number em centavos
    descrição: string,
    peso : number,
    deletado : boolean | Um produto deletado não pode ser atualizado nem adicionado em um pedido.
} */

/* Funcionalidades a serem implementadas:

Listar todos os produtos
Obter informações de um produto em particular
Adicionar um novo produto
Atualizar informações de um produto
Marcar um produto como deletado
Alterar a quantidade disponível de um produto */