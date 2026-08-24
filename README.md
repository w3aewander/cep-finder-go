# BuscaCEP

Aplicação full-stack para pesquisar endereços brasileiros a partir do CEP.

## Executar localmente

Instale e gere a interface React:

```bash
cd frontend
npm install
npm run build
```

Em seguida, na raiz do projeto, inicie a aplicação completa:

```bash
go run .
```

Abra `http://localhost:8080`. O Gin entrega a interface compilada e o endpoint `GET /api/cep/:cep`; o CEP é normalizado antes da consulta à API pública ViaCEP.

Para desenvolver a interface com atualização automática, execute `npm run dev` dentro de `frontend` e abra `http://localhost:5173`. O Vite encaminha as chamadas `/api` para o Gin.

## Exemplo de resposta

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
