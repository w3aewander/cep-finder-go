# CEP-FINDER - Buscador de Endereço
>
> Desenvolvido por Wanderlei Silva do Carmo <wander.silva@gmail.com>
>
> Engenheiro Arquiteto de Software
>

## Aplicação para uso didático

Uma aplicação full-stack para consultar endereços brasileiros a partir de um CEP. Ela combina uma interface React com um servidor Go/Gin que valida o CEP e consulta a API pública [ViaCEP](https://viacep.com.br/).

Além de servir para consultas rápidas, o projeto é intencionalmente pequeno e separado por responsabilidades, para facilitar o estudo de uma comunicação frontend → backend → serviço externo.

## O que a aplicação faz

1. A pessoa informa um CEP no campo de busca — com ou sem pontuação.
2. A interface mantém apenas os oito dígitos e aplica a máscara `99999-999`.
3. O React pede `GET /api/cep/:cep` ao backend.
4. O backend valida o CEP, consulta o ViaCEP e adapta a resposta para o formato da aplicação.
5. A tela exibe endereço, bairro, cidade, estado e, quando disponíveis, complemento e DDD. O resultado também pode ser copiado.

```text
Navegador (React) ── GET /api/cep/01001000 ──> Go + Gin
                                                     │
                                                     └──> ViaCEP
                                                              │
Navegador <── JSON normalizado <──────────────────────────────┘
```

## Para quem vai usar

1. Abra a aplicação no navegador.
2. Digite os oito números do CEP, por exemplo `01001-000`.
3. Selecione **Buscar** ou pressione Enter.
4. Confira os dados encontrados e, se desejar, use **Copiar** para enviar o endereço à área de transferência.

Se o CEP não existir, estiver incompleto ou o serviço externo não responder, a tela mostra uma mensagem explicando o problema. A consulta depende da disponibilidade e da cobertura da base do ViaCEP.

## Tecnologias

| Camada | Tecnologia | Papel no projeto |
| --- | --- | --- |
| Backend | Go 1.22 e Gin | Rota HTTP, validação, CORS, arquivos estáticos e integração externa |
| Frontend | React + TypeScript | Formulário, estados da tela e apresentação do endereço |
| Ferramentas do frontend | Vite | Servidor de desenvolvimento e geração dos arquivos de produção |
| Interface | CSS, Lucide React e Framer Motion | Estilos, ícones e animações |
| Dados | ViaCEP | Fonte pública dos dados de CEP |

## Requisitos

- [Go](https://go.dev/dl/) 1.22 ou superior;
- [Node.js](https://nodejs.org/) e npm (recomenda-se uma versão LTS atual);
- conexão com a internet para consultar o ViaCEP.

## Executar localmente

### Aplicação completa, como em produção

Primeiro, instale as dependências e gere a versão estática do frontend:

```bash
cd frontend
npm install
npm run build
```

Depois, volte à raiz e inicie o servidor:

```bash
cd ..
go run .
```

Abra [http://localhost:8080](http://localhost:8080). O Gin entrega a interface compilada em `frontend/dist` e a API no mesmo endereço.

### Desenvolvimento do frontend com atualização automática

Use dois terminais.

No primeiro, inicie a API:

```bash
go run .
```

No segundo, inicie o Vite:

```bash
cd frontend
npm install
npm run dev
```

Abra o endereço informado pelo Vite — normalmente [http://localhost:5173](http://localhost:5173). A configuração do Vite encaminha chamadas iniciadas por `/api` para `http://localhost:8080`, então o frontend continua usando `fetch('/api/...')` sem conhecer o endereço do backend.

> O backend libera CORS especificamente para `http://localhost:5173`, que é a porta padrão do Vite. Caso o Vite seja iniciado em outra origem, ajuste a função `cors()` em `main.go`.

## Comandos úteis

| Onde | Comando | Resultado |
| --- | --- | --- |
| Raiz | `go run .` | Inicia a API e, após o build, também a interface em `:8080` |
| Raiz | `go test ./...` | Executa os testes unitários do backend |
| `frontend` | `npm run dev` | Inicia o Vite com recarga automática |
| `frontend` | `npm run build` | Verifica TypeScript e gera `frontend/dist` |
| `frontend` | `npm run preview` | Visualiza localmente o build gerado pelo Vite |

## API HTTP

### Consultar um CEP

```http
GET /api/cep/:cep
```

O parâmetro pode conter pontuação: o backend remove qualquer caractere que não seja dígito. Após a normalização, ele precisa ter exatamente oito números.

Exemplo:

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

Os campos `complemento` e `ddd` são opcionais e só aparecem quando há valor na resposta de origem.

| Situação | Status | Exemplo de resposta |
| --- | --- | --- |
| CEP com menos ou mais de oito dígitos | `400 Bad Request` | `{"error":"CEP inválido. Informe os 8 dígitos do CEP."}` |
| CEP válido, mas não localizado | `404 Not Found` | `{"error":"Não encontramos um endereço para este CEP."}` |
| Falha ao acessar ou interpretar o ViaCEP | `502 Bad Gateway` | `{"error":"O serviço de CEP está indisponível. Tente novamente em instantes."}` |

## Estrutura do projeto

```text
.
├── main.go                 # Servidor Gin, rota, integração ViaCEP e CORS
├── main_test.go            # Testes unitários da consulta ao ViaCEP
├── go.mod / go.sum         # Módulo Go e dependências
├── README.md
└── frontend/
    ├── src/
    │   ├── App.tsx         # Componente, formulário e estados da interface
    │   ├── main.tsx        # Ponto de montagem do React
    │   └── styles.css      # Estilos responsivos da aplicação
    ├── vite.config.ts      # Proxy de /api para o backend no desenvolvimento
    └── package.json        # Scripts e dependências do frontend
```

`frontend/dist/` não é fonte do projeto: é criado pelo comando `npm run build` e é o diretório que o Gin publica em produção local.

## Como o código está organizado

### Backend: `main.go`

- `main()` configura o Gin com log, recuperação de erros e CORS; registra `GET /api/cep/:cep`; e publica os arquivos gerados pelo Vite.
- `digitsOnly` é uma expressão regular usada para remover hífens, pontos e outros caracteres do CEP recebido.
- `lookupCEP(...)` concentra a integração HTTP. Ela recebe um `context`, um `http.Client` e o CEP, para que a lógica seja reutilizável e testável.
- O cliente HTTP possui timeout de oito segundos. Isso impede que uma falha do serviço externo deixe a requisição aguardando indefinidamente.
- `viacepResponse` representa os nomes de campos devolvidos pelo ViaCEP, como `localidade` e `uf`.
- `cepResponse` é o contrato público desta aplicação. Nele, `localidade` é apresentado como `cidade` e `uf` como `estado`, deixando a API própria mais clara para quem a consome.
- `errNotFound` é um erro sentinela: a rota consegue identificá-lo com `errors.Is` e devolver `404`, enquanto outros erros externos viram `502`.

### Frontend: `frontend/src/App.tsx`

O componente `App` mantém cinco estados principais:

| Estado | Finalidade |
| --- | --- |
| `cep` | Texto digitado, já com máscara visual |
| `address` | Endereço retornado pela API ou `null` antes de uma busca |
| `message` | Mensagem de validação, erro ou confirmação de cópia |
| `loading` | Controla o indicador de carregamento e desabilita o botão |
| `helpOpen` | Abre e fecha o diálogo “Como funciona?” |

Na função `search`, o formulário previne seu envio tradicional, remove a máscara, valida o tamanho e usa `fetch` para chamar a API. O `try/catch/finally` permite exibir falhas sem travar a interface e garante que `loading` volte a `false` ao fim da requisição.

`maskCEP` cuida apenas da experiência no navegador; a validação decisiva também existe no backend. Essa duplicação é deliberada: a interface dá retorno imediato, enquanto o servidor continua protegido quando alguém chama a API diretamente.

## Testes

Os testes não fazem chamadas reais à internet. Em `main_test.go`, `roundTripperFunc` simula o transporte HTTP de um `http.Client`, permitindo controlar a resposta recebida por `lookupCEP`.

Os cenários cobertos são:

- uma resposta válida do ViaCEP é transformada em `cepResponse`;
- a marca `{"erro":"true"}` do ViaCEP é convertida em `errNotFound`.

Execute-os com:

```bash
go test ./...
```

## Roteiro de estudo sugerido

1. Comece em `frontend/src/main.tsx` para ver onde o React é montado.
2. Leia `App.tsx`, especialmente `maskCEP`, `search` e `copyAddress`, para acompanhar eventos e estado no React.
3. Veja `vite.config.ts` e observe por que `/api` chega ao servidor Go durante o desenvolvimento.
4. Em `main.go`, acompanhe a rota até `lookupCEP` e compare `viacepResponse` com `cepResponse`.
5. Por fim, leia `main_test.go` para entender como uma dependência HTTP é simulada sem acessar a rede.

## Limitações e cuidados

- Não há banco de dados nem cache: cada consulta válida gera uma chamada ao ViaCEP.
- Os dados exibidos são os retornados pelo serviço externo e podem ser incompletos para alguns CEPs.
- O projeto está configurado para uso local. Antes de publicar, defina a origem permitida pelo CORS para o domínio da interface e considere logs, monitoramento, limite de requisições e cache.
- A funcionalidade de copiar depende da API de área de transferência do navegador, que normalmente requer um contexto seguro (HTTPS) fora de `localhost`.

## Licença

Este projeto é distribuído sob a **GNU General Public License, versão 3.0 (GPL-3.0-only)**. Consulte o texto completo em [GNU GPL v3](https://www.gnu.org/licenses/gpl-3.0.html).

