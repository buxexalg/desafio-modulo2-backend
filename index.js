const Koa = require('koa');
const bodyparser = require('koa-bodyparser');

const server = new Koa();

server.use(bodyparser());

const sucessoRequisicao = (ctx, conteudo, codigoREST = 200) => {
    ctx.status = codigoREST;
    ctx.body = {
        status: 'sucesso',
        dados: conteudo,
    }
}

const falhaRequisicao = (ctx, mensagem, codigoREST = 404) => {
    ctx.status = codigoREST;
    ctx.body = {
        status: 'erro',
        dados: {
            mensagem: mensagem
        }
    }
}

const estoque = [];
const pedidos = [];

const criarProduto = (ctx) => {
    const pedidoJSON = ctx.request.body;
    if (!pedidoJSON.nome || !pedidoJSON.quantidade || pedidoJSON.quantidade < 0 || !pedidoJSON.valor || pedidoJSON.valor < 0) {
        falhaRequisicao(ctx, 'Insira corretamente todos os dados necessários.', 400);
        return false;
    }

    let idProduto = 0;
    (estoque.length === 0) ? idProduto = 1: idProduto = estoque[estoque.length - 1].id + 1;

    const novoProduto = {
        id: idProduto,
        nome: pedidoJSON.nome,
        quantidade: pedidoJSON.quantidade,
        valor: pedidoJSON.valor,
        descrição: (pedidoJSON.valor) ? pedidoJSON.valor : '',
        peso: (pedidoJSON.peso) ? pedidoJSON.peso : null,
        deletado: false
    }
    estoque.push(novoProduto);
    return novoProduto;
}

const consultaProduto = (id, ctx) => {
    for (let produto of estoque) {
        if (produto.id == id) return produto;

    }
    falhaRequisicao(ctx, 'Produto não encontrado.', 404);
    return false;
}

const listarProdutos = () => {
    return estoque;
}

const atualizaProduto = (id, ctx) => {
    const produtoJSON = ctx.request.body;
    if (produtoJSON.id) {
        falhaRequisicao(ctx, 'Não é possível alterar o ID do produto.', 403);
        return false;
    } else if (!produtoJSON.nome || !produtoJSON.quantidade || produtoJSON.quantidade < 0 || !produtoJSON.valor || produtoJSON.valor < 0) {
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
        const indexProduto = estoque.indexOf(produtoAAlterar);

        estoque[indexProduto] = {
            id: estoque[indexProduto].id,
            nome: produtoJSON.nome,
            quantidade: produtoJSON.quantidade,
            valor: produtoJSON.valor,
            descrição: (produtoJSON.valor) ? produtoJSON.valor : estoque[indexProduto]["descrição"],
            peso: (produtoJSON.peso) ? produtoJSON.peso : estoque[indexProduto].peso,
            deletado: estoque[indexProduto].deletado
        }

        return estoque[indexProduto];
    }
}


const deletaProduto = (id, ctx) => {
    const produtoADeletar = consultaProduto(id, ctx);

    if (!produtoADeletar) {
        falhaRequisicao(ctx, 'Produto não encontrado.', 404);
        return false;
    } else {
        const indexProduto = estoque.indexOf(produtoADeletar);

        estoque[indexProduto].deletado = true;

        return estoque[indexProduto];
    }
}

const alteraQuantidade = (id, quantidade, ctx) => {
    const produtoEscolhido = consultaProduto(id, ctx);
    if (quantidade < 0) {
        produtoEscolhido.quantidade += quantidade;
        return produtoEscolhido;
    } else if (quantidade > 0) {
        produtoEscolhido.quantidade -= quantidade;
        return produtoEscolhido;
    }
}

const verificaQuantidade = (id, quantidade, ctx) => {
    const produtoEscolhido = consultaProduto(id, ctx);
    if (!produtoEscolhido) {
        falhaRequisicao(ctx, 'Produto não encontrado.', 404);
        return false;
    } else {
        if (quantidade < 0) {
            if (produtoEscolhido.quantidade === 0) {
                falhaRequisicao(ctx, 'Não é possível reduzir a quantidade de um produto sem estoque.', 403);
                return false;
            } else if ((produtoEscolhido.quantidade + quantidade) < 0) {
                falhaRequisicao(ctx, 'Não é possível adicionar mais estoque que o estoque disponível.', 403);
                return false;
            } else {
                return true;
            }
        } else if (quantidade > 0) {
            return true;
        } else {
            falhaRequisicao(ctx, 'Não é possível adicionar 0 produtos.', 400);
            return false;
        }
    }
}

const criarPedido = (ctx) => {

    let idPedido = 0;
    (pedidos.length === 0) ? idPedido = 1: idPedido = pedidos[pedidos.length - 1].id + 1;


    const novoPedido = {
        id: idPedido,
        produtos: [],
        estado: 'incompleto',
        idCliente: idPedido,
        deletado: false,
        valorTotal: 0
    }

    pedidos.push(novoPedido);
    return novoPedido;
}

const listarPedidos = () => {
    const listaNaoDeletados = [];
    pedidos.forEach((item) => {
        if (item.deletado === false || item.estado === 'cancelado') listaNaoDeletados.push(item);
    })
    return listaNaoDeletados;
}

const listarPedidosEntregues = () => {
    const listaEntregues = [];
    pedidos.forEach((item) => {
        if (item.estado === 'entregue') listaEntregues.push(item);
    })
    return listaEntregues;
}

const listarPedidosPagos = () => {
    const listaPagos = [];
    pedidos.forEach((item) => {
        if (item.estado === 'pago') listaPagos.push(item);
    })
    return listaPagos;
}

const listarPedidosProcessando = () => {
    const listaProcessando = [];
    pedidos.forEach((item) => {
        if (item.estado === 'processando') listaProcessando.push(item);
    })
    return listaProcessando;
}

const listarPedidosCancelados = () => {
    const listaCancelados = [];
    pedidos.forEach((item) => {
        if (item.estado === 'cancelado') listaCancelados.push(item);
    })
    return listaCancelados;
}

const listarPedido = (id, ctx) => {
    for (let pedido of pedidos) {
        if (pedido.id == id) return pedido;
    }
    falhaRequisicao(ctx, 'Pedido não encontrado.', 404);
    return false;
}

const atualizarEstado = (id, ctx) => {
    const pedidoJSON = ctx.request.body;
    const pedidoAAtualizar = listarPedido(id, ctx);
    if (pedidoAAtualizar.produtos.length === 0) {
        falhaRequisicao(ctx, 'Não é possível alterar o estado de um pedido sem produtos no carrinho.', 403);
        return false;
    } else {
        pedidoAAtualizar.estado = pedidoJSON.estado;
        return pedidoAAtualizar;
    }
}

const consultaProdutoCarrinho = (idProduto, idPedido, ctx) => {
    const pedidoAAlterar = listarPedido(idPedido, ctx);
    for (let produto of pedidoAAlterar.produtos) {
        if (produto.id == idProduto) return true;
    }
    return false;
}

const adicionarProdutoAoPedido = (id, ctx) => {
    const produtoAAdicionar = ctx.request.body;
    const produtoNoEstoque = consultaProduto(produtoAAdicionar.id, ctx);
    const pedidoAAdicionar = listarPedido(id, ctx);
    const listaProdutos = pedidoAAdicionar.produtos;

    if (pedidoAAdicionar && produtoNoEstoque) {
        if (produtoNoEstoque.deletado === false) {
            if (pedidoAAdicionar.estado === 'incompleto') {
                if (produtoNoEstoque.quantidade < produtoAAdicionar.quantidade) {
                    falhaRequisicao(ctx, `Não é possível adicionar uma quantidade maior do que o estoque. Atualmente, temos ${produtoNoEstoque.quantidade} unidades.`, 403);
                    return false;
                } else if (verificaQuantidade(produtoAAdicionar.id, produtoAAdicionar.quantidade, ctx)) {
                    const ProdutoNoCarrinho = consultaProdutoCarrinho(produtoAAdicionar.id, id, ctx);
                    if (ProdutoNoCarrinho) {
                        listaProdutos.forEach((item, i) => {
                            if (item.id === produtoAAdicionar.id) {
                                item.quantidade += produtoAAdicionar.quantidade;
                            }
                        })
                        calcularValorTotal(id);
                        alteraQuantidade(produtoAAdicionar.id, produtoAAdicionar.quantidade, ctx)
                        return pedidoAAdicionar;
                    } else {
                        delete produtoAAdicionar.alterar;
                        listaProdutos.push(produtoAAdicionar);
                        calcularValorTotal(id);
                        alteraQuantidade(produtoAAdicionar.id, produtoAAdicionar.quantidade, ctx)
                        return listarPedido(id);
                    }
                } else {
                    verificaQuantidade(produtoAAdicionar.id, produtoAAdicionar.quantidade, ctx);
                }
            } else {
                falhaRequisicao(ctx, 'Não é possível adicionar um produto em um pedido completo.', 403);
                return false;
            }
        } else {
            falhaRequisicao(ctx, 'Não é possível adicionar um produto deletado.', 403);
            return false;
        }
    } else {
        falhaRequisicao(ctx, 'ID não encontrado.', 404);
        return false;
    }
}

const removerProdutoDoPedido = (id, ctx) => {
    const produtoARemover = ctx.request.body;
    const produtoNoEstoque = consultaProduto(produtoARemover.id, ctx);
    const pedidoARemover = listarPedido(id, ctx);
    const listaProdutos = pedidoARemover.produtos;

    if (pedidoARemover && produtoNoEstoque) {
        if (produtoARemover.quantidade === 0) {
            falhaRequisicao(ctx, 'Não é possível adicionar 0 produtos.', 400);
            return false;
        }
        if (produtoNoEstoque.deletado === false) {
            if (pedidoARemover.estado === 'incompleto') {
                const ProdutoNoCarrinho = consultaProdutoCarrinho(produtoARemover.id, id, ctx);
                if (ProdutoNoCarrinho) {
                    listaProdutos.forEach((item, i) => {
                        if (item.id === produtoARemover.id) {
                            console.log(produtoARemover);
                            item.quantidade -= produtoARemover.quantidade;
                            if (item.quantidade === 0) {
                                listaProdutos.splice(i, 1);
                            }
                        }
                    })
                    calcularValorTotal(id);
                    alteraQuantidade(pedidoARemover.id, -(pedidoARemover.quantidade), ctx)
                    return pedidoARemover;
                } else {
                    falhaRequisicao(ctx, 'Não é possível remover um produto que não está no carrinho.', 403);
                return false;
                }
            } else {
                falhaRequisicao(ctx, 'Não é possível adicionar um produto em um pedido completo.', 403);
                return false;
            }
        } else {
            falhaRequisicao(ctx, 'Não é possível adicionar um produto deletado.', 403);
            return false;
        }
    } else {
        falhaRequisicao(ctx, 'ID não encontrado.', 404);
    }
}

const calcularValorTotal = (id, ctx) => {
    const pedidoAAlterar = listarPedido(id, ctx);
    const listaDePedidos = pedidoAAlterar.produtos;

    let soma = 0;
    listaDePedidos.forEach((item) => {
        soma += item.valor * item.quantidade;
    })
    pedidoAAlterar.valorTotal = soma;
}

const deletarPedido = (id, ctx) => {
    const pedidoADeletar = listarPedido(id, ctx);

    if (!pedidoADeletar) {
        falhaRequisicao(ctx, 'Produto não encontrado.', 404);
        return false;
    } else {
        const indexPedido = pedidos.indexOf(pedidoADeletar);

        pedidos[indexPedido].deletado = true;

        return pedidos[indexPedido];
    }
}

server.use((ctx) => {
    const path = ctx.url;
    const method = ctx.method;
    const subPath = path.split('/');

    if (path === "/products") {
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
                falhaRequisicao(ctx, 'Método não permitido', 405);
                break;
        }
    } else
    if (path.includes('products')) {
        if (subPath[1] === "products") {
            if (subPath[2]) {
                switch (method) {
                    case 'GET':
                        if (consultaProduto(subPath[2], ctx)) sucessoRequisicao(ctx, consultaProduto(subPath[2], ctx));
                        break;
                    case 'PUT':
                        //O JSON de entrada é o mesmo do POST. O código seleciona o campo que foi alterado e substitui.
                        if (atualizaProduto(subPath[2], ctx)) sucessoRequisicao(ctx, atualizaProduto(subPath[2], ctx), 200)
                        break;
                    case 'DELETE':
                        const produtoDeletado = deletaProduto(subPath[2], ctx);
                        if (produtoDeletado) sucessoRequisicao(ctx, produtoDeletado, 200)
                        break;
                    default:
                        falhaRequisicao(ctx, 'Método não permitido', 405);
                        break;
                }
            } else {
                falhaRequisicao(ctx, 'Não encontrado.', 404);
            }
        } else {
            falhaRequisicao(ctx, 'Não encontrado.', 404);
        }
    } else
    if (path === "/orders") {
        switch (method) {
            case 'POST':
                //O JSON de entrada é objeto vazio.
                const novoPedido = criarPedido(ctx);
                if (novoPedido) {
                    sucessoRequisicao(ctx, novoPedido, 201);
                }
                break;
            case 'GET':
                sucessoRequisicao(ctx, listarPedidos(), 200);
                break;
            default:
                falhaRequisicao(ctx, 'Método não permitido', 405);
                break;
        }
    } else
    if (path.includes("orders")) {
        if (!isNaN(subPath[2])) {
            switch (method) {
                case 'GET':
                    if (listarPedido(subPath[2], ctx)) sucessoRequisicao(ctx, listarPedido(subPath[2], ctx), 200);
                    break;
                case 'PUT':
                    if (ctx.request.body.estado) {
                        //Caso o JSON de entrada contenha estado, ele alterará o mesmo, no formato {estado: pago}
                        if (atualizarEstado(subPath[2], ctx)) sucessoRequisicao(ctx, atualizarEstado(subPath[2], ctx), 200);
                        break;
                    } else if (ctx.request.body.id) {
                        //Caso o JSON de entrada contenha ID, ele adicionará ou removerá o produto do pedido.
                        //Caso o campo alterar : adicionar, o produto será adicionado. Caso alterar : remover, será removido.
                        if (ctx.request.body.alterar === 'adicionar') {
                            const produtoAdicionado = adicionarProdutoAoPedido(subPath[2], ctx);
                            if (produtoAdicionado) sucessoRequisicao(ctx, produtoAdicionado, 200);
                            break;
                        } else if (ctx.request.body.alterar === 'remover') {
                            const produtoRemovido = removerProdutoDoPedido(subPath[2], ctx);
                            if (produtoRemovido) sucessoRequisicao(ctx, produtoRemovido, 200);
                            break;
                        } else {
                            falhaRequisicao(ctx, 'Insira corretamente todos os dados necessários.', 400);
                        }
                    } else {
                        falhaRequisicao(ctx, 'Insira corretamente todos os dados necessários.', 400);
                    }
                    case 'DELETE':
                        if (deletarPedido(subPath[2], ctx)) sucessoRequisicao(ctx, deletarPedido(subPath[2], ctx), 200);
                        break;
                    default:
                        falhaRequisicao(ctx, 'Método não permitido', 405);
                        break;
            }
        } else if (isNaN(subPath[2])) {
            if (method === 'GET') {
                switch (subPath[2]) {
                    //Para listar os pedidos específicos, a rota será localhost:8081/orders/paid, por exemplo.
                    case 'delivered':
                        sucessoRequisicao(ctx, listarPedidosEntregues(), 200);
                        break;
                    case 'paid':
                        sucessoRequisicao(ctx, listarPedidosPagos(), 200);
                        break;
                    case 'processing':
                        sucessoRequisicao(ctx, listarPedidosProcessando(), 200);
                        break;
                    case 'canceled':
                        sucessoRequisicao(ctx, listarPedidosCancelados(), 200);
                        break;
                }
            } else {
                falhaRequisicao(ctx, 'Método não permitido', 405);
            }
        } else {
            falhaRequisicao(ctx, 'Insira corretamente todos os dados necessários.', 400);
        }
    } else {
        falhaRequisicao(ctx, 'Insira corretamente todos os dados necessários.', 400);
    }
})

server.listen(8081, () => console.log("Rodando na porta 8081"))