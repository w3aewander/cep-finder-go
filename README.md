# CEP-FINDER — Buscador de endereços por CEP

Aplicação web para consultar endereços brasileiros a partir de um CEP. Informe os oito dígitos e receba logradouro, bairro, cidade, estado e, quando disponíveis, complemento e DDD.

O projeto foi criado também como material de estudo: o React conversa com uma API em Go, que por sua vez consulta o serviço público [ViaCEP](https://viacep.com.br/).

> Desenvolvido por Wanderlei Silva do Carmo (<wander.silva@gmail.com>).

## Índice

- [O que você precisa](#o-que-você-precisa)
- [Instalação e primeira execução](#instalação-e-primeira-execução)
- [Como usar a aplicação](#como-usar-a-aplicação)
- [Desenvolvendo a interface](#desenvolvendo-a-interface)
- [Comandos úteis](#comandos-úteis)
- [API](#api)
- [Solução de problemas](#solução-de-problemas)
- [Para estudar o código](#para-estudar-o-código)

## O que você precisa

Antes de começar, instale:

| Ferramenta | Versão necessária | Como verificar |
| --- | --- | --- |
| [Go](https://go.dev/dl/) | 1.22 ou superior | `go version` |
| [Node.js](https://nodejs.org/) | versão LTS atual recomendada | `node --version` |
| npm | instalado junto com o Node.js | `npm --version` |
| Git | opcional, se for clonar o repositório | `git --version` |

Também é necessária uma conexão com a internet enquanto a aplicação estiver consultando CEPs, pois os dados vêm do ViaCEP.

## Instalação e primeira execução

Siga esta seção na ordem, inclusive se for a primeira vez usando Go ou React.

### 1. Baixe o projeto

**Opção A — usando Git**

```bash
git clone <URL-DO-REPOSITORIO>
cd cep-finder
```

Substitua `<URL-DO-REPOSITORIO>` pelo endereço do repositório. Se ele já foi baixado, apenas abra um terminal dentro da pasta `cep-finder`.

**Opção B — arquivo ZIP**

Baixe o ZIP do projeto, extraia-o e abra um terminal na pasta extraída. Ela deve conter arquivos como `main.go`, `go.mod` e a pasta `frontend`.

### 2. Instale as dependências da interface

Ainda na pasta raiz do projeto, execute:

```bash
cd frontend
npm install
```

Esse comando baixa as bibliotecas usadas pela interface. Aguarde até ele terminar sem erros.

### 3. Gere a interface para o servidor Go

No mesmo terminal, execute:

```bash
npm run build
cd ..
```

O comando cria a pasta `frontend/dist`. Ela é a versão otimizada da interface que será entregue pelo servidor Go.

### 4. Inicie a aplicação

De volta à raiz — a mesma pasta que contém `main.go` — execute:

```bash
go run .
```

Você deverá ver a mensagem `API disponível em http://localhost:8080`. Mantenha esse terminal aberto e acesse [http://localhost:8080](http://localhost:8080) no navegador.

Para parar a aplicação, volte ao terminal e pressione `Ctrl+C`.

## Como usar a aplicação

1. Abra `http://localhost:8080`.
2. Digite um CEP com oito números, por exemplo `01001-000`.
3. Clique em **Buscar** ou pressione `Enter`.
4. Confira o endereço retornado.
5. Se desejar, use **Copiar** para levar o resultado para a área de transferência.

Você pode digitar o CEP com ou sem hífen; a interface ajusta a formatação automaticamente. CEPs inválidos, inexistentes ou falhas temporárias do serviço mostram uma mensagem na tela.

## Desenvolvendo a interface

Para alterar a interface com atualização automática, use dois terminais.

No primeiro, na raiz do projeto, inicie a API:

```bash
go run .
```

No segundo, inicie o Vite:

```bash
cd frontend
npm run dev
```

Abra o endereço exibido pelo Vite — normalmente [http://localhost:5173](http://localhost:5173). As chamadas para `/api` serão encaminhadas automaticamente para o Go na porta `8080`.

Quando quiser testar a versão que será entregue pelo Go, gere a interface de novo:

```bash
cd frontend
npm run build
cd ..
go run .
```

## Comandos úteis

| Onde executar | Comando | Resultado |
| --- | --- | --- |
| Raiz | `go run .` | Inicia a API e serve a interface gerada em `:8080` |
| Raiz | `go test ./...` | Executa os testes do backend |
| `frontend` | `npm install` | Instala as dependências da interface |
| `frontend` | `npm run dev` | Inicia o ambiente de desenvolvimento com recarga automática |
| `frontend` | `npm run build` | Verifica TypeScript e cria `frontend/dist` |
| `frontend` | `npm run preview` | Visualiza localmente o build gerado pelo Vite |

## API

### Consultar um CEP

```http
GET /api/cep/:cep
```

O parâmetro aceita pontuação, mas precisa conter exatamente oito dígitos após a normalização.

Exemplo, com o servidor em execução:

```bash
curl http://localhost:8080/api/cep/01001-000
```

Resposta de sucesso (`200 OK`):

```json
{
  "cep": "01001-000",
  "logradouro": "Praça da Sé",
  "bairro": "Sé",
  "cidade": "São Paulo",
  "estado": "SP",
  "ddd": "11"
}
```

`complemento` e `ddd` só aparecem quando forem informados pelo ViaCEP.

| Situação | Status | Resposta |
| --- | --- | --- |
| CEP com quantidade incorreta de dígitos | `400` | `CEP inválido. Informe os 8 dígitos do CEP.` |
| CEP válido, mas não localizado | `404` | `Não encontramos um endereço para este CEP.` |
| ViaCEP indisponível ou resposta inválida | `502` | Mensagem para tentar novamente em instantes |

## Solução de problemas

### `go: command not found` ou `go não é reconhecido`

O Go não está instalado ou não foi incluído no `PATH`. Instale-o pelo [site oficial](https://go.dev/dl/), feche e abra o terminal novamente e confirme com `go version`.

### `npm: command not found` ou `npm não é reconhecido`

Instale uma versão LTS do [Node.js](https://nodejs.org/). O npm é instalado junto. Reinicie o terminal e confirme com `npm --version`.

### A página abre, mas não tem estilo ou mostra erro 404

Provavelmente a interface ainda não foi gerada. Pare o servidor e, na raiz do projeto, execute:

```bash
cd frontend
npm install
npm run build
cd ..
go run .
```

### A porta 8080 já está em uso

Encerre outro processo que esteja usando a porta ou altere `router.Run(":8080")` em `main.go` para uma porta livre, como `:8081`. Então abra a mesma porta no navegador.

### A busca retorna mensagem de indisponibilidade

Verifique sua conexão com a internet e tente novamente. A aplicação depende do ViaCEP; se o serviço externo estiver indisponível, a consulta não pode ser concluída.

### Alterei arquivos em `frontend/src`, mas não vejo a mudança em `localhost:8080`

Execute `npm run build` dentro de `frontend` e reinicie `go run .`, ou use `npm run dev` para trabalhar com recarga automática.

## Para estudar o código

O fluxo da aplicação é:

```text
Navegador (React) → GET /api/cep/:cep → Go + Gin → ViaCEP
       ↑                                      │
       └──────────── JSON normalizado ────────┘
```

Uma boa ordem de leitura é:

1. `frontend/src/main.tsx`: onde o React é montado.
2. `frontend/src/App.tsx`: formulário, máscara do CEP, busca e cópia do endereço.
3. `frontend/vite.config.ts`: proxy de `/api` no desenvolvimento.
4. `main.go`: rota HTTP, validação, CORS e integração com o ViaCEP.
5. `main_test.go`: testes da integração HTTP sem chamadas reais à internet.

No backend, a resposta do ViaCEP é convertida para um contrato próprio: `localidade` vira `cidade` e `uf` vira `estado`. Isso evita acoplar a interface diretamente ao formato do serviço externo.

## Limitações e cuidados

- Não há banco de dados nem cache: cada busca válida consulta o ViaCEP.
- Alguns CEPs podem ter campos sem informação, dependendo da base de origem.
- O CORS de desenvolvimento aceita `http://localhost:5173`. Para publicar o projeto, ajuste a origem permitida em `cors()` no arquivo `main.go`.
- Fora de `localhost`, a função de cópia normalmente exige que a aplicação esteja em HTTPS.
- Para produção, coloque a aplicação atrás de um proxy reverso com HTTPS e mantenha o processo Go acessível apenas pela rede necessária.

## Licença

Este projeto é distribuído sob a **GNU General Public License, versão 3.0 (GPL-3.0-only)**. Consulte a [GNU GPL v3](https://www.gnu.org/licenses/gpl-3.0.html).
