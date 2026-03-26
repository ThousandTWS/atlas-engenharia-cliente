# API: `acompanhamento-servicos`

Este documento descreve a API de backend necessária para suportar corretamente a tela `acompanhamento-servicos`.

Hoje o frontend consegue montar a tela unificada usando os módulos existentes (`AVCB`, `CLCB`, `Obras`, `Processos Adm.`), mas alguns recursos ainda estão em persistência local por falta de API própria:

- configuracao de situacoes por tipo de servico
- historico de mudancas de situacao
- subtipo por tipo de servico
- descricao de acompanhamento separada da descricao da mudanca de situacao
- pasta/atalho associada ao servico
- consolidacao oficial em endpoint unico

## Objetivo

Criar uma API unica para acompanhamento operacional de servicos, com layout unificado e filtro por tipo.

Tipos suportados:

- `AVCB`
- `CLCB`
- `OBRAS`
- `PROCESSOS_ADM`

## Requisitos funcionais

### Tabela unica

A API deve retornar uma lista unificada com colunas compatíveis para todos os tipos:

1. `codigo`
2. `nomeCliente`
3. `telefone`
4. `tipoServico`
5. `subtipo`
6. `situacao`
7. `tempoNaSituacao`
8. `descricao`
9. `valorContrato`
10. `dataContrato`
11. `condicaoPagamento`
12. `aReceber`
13. `recebido`
14. `custos`
15. `folderUrl`

### Situacoes por tipo

Cada tipo de servico deve ter seu proprio conjunto de situacoes.

Regras:

- usuario pode criar situacao
- usuario pode renomear situacao
- usuario pode excluir situacao
- usuario pode definir situacao inicial padrao por tipo
- ao criar um servico, a situacao inicial padrao deve ser aplicada automaticamente

### Historico de situacao

Cada mudanca de situacao deve gerar um item de historico.

Cada item deve registrar:

- situacao anterior
- nova situacao
- data/hora
- responsavel
- descricao da mudanca

Observacao:

- essa descricao de historico e diferente da `descricao` principal do cadastro do servico

### Cadastro completo

Ao abrir um servico, a API deve permitir:

- consultar os dados completos do cadastro
- consultar o historico cronologico
- atualizar cadastro
- atualizar situacao com log automatico
- gerar dados para relatorio PDF

## Modelo sugerido

### Entidade: `acompanhamento_servico`

```json
{
  "id": 123,
  "origemId": 88,
  "tipoServico": "AVCB",
  "codigo": "AVCB-2026-001",
  "nomeCliente": "Cliente Exemplo",
  "telefone": "11999999999",
  "subtipo": "Projeto",
  "situacao": "EM_ANDAMENTO",
  "situacaoInicial": "PENDENTE",
  "descricao": "Descricao geral do cadastro",
  "valorContrato": 15000.0,
  "dataContrato": "2026-03-13",
  "condicaoPagamento": "30/60",
  "aReceber": 8000.0,
  "recebido": 7000.0,
  "custos": 2500.0,
  "folderUrl": "https://drive.google.com/...",
  "ultimaMudancaSituacaoEm": "2026-03-10T14:30:00Z",
  "createdAt": "2026-03-01T10:00:00Z",
  "updatedAt": "2026-03-13T09:00:00Z"
}
```

### Entidade: `acompanhamento_servico_historico`

```json
{
  "id": 9001,
  "servicoId": 123,
  "situacaoAnterior": "PENDENTE",
  "novaSituacao": "EM_ANDAMENTO",
  "descricao": "Recebido retorno do cliente e iniciado atendimento",
  "responsavelId": 17,
  "responsavelNome": "Vinicius Oliveira",
  "createdAt": "2026-03-10T14:30:00Z"
}
```

### Entidade: `acompanhamento_servico_situacao_config`

```json
{
  "id": 51,
  "tipoServico": "AVCB",
  "nome": "EM_ANDAMENTO",
  "ordem": 2,
  "situacaoInicial": false,
  "ativo": true
}
```

## Endpoints sugeridos

### 1. Listar servicos unificados

`GET /acompanhamento-servicos`

Query params sugeridos:

- `tipoServico`
- `situacao`
- `subtipo`
- `nomeCliente`
- `codigo`
- `dataContratoInicio`
- `dataContratoFim`
- `page`
- `size`
- `sort`

Resposta:

```json
{
  "content": [
    {
      "id": 123,
      "origemId": 88,
      "tipoServico": "AVCB",
      "codigo": "AVCB-2026-001",
      "nomeCliente": "Cliente Exemplo",
      "telefone": "11999999999",
      "subtipo": "Projeto",
      "situacao": "EM_ANDAMENTO",
      "tempoNaSituacao": 15,
      "descricao": "Descricao geral",
      "valorContrato": 15000,
      "dataContrato": "2026-03-13",
      "condicaoPagamento": "30/60",
      "aReceber": 8000,
      "recebido": 7000,
      "custos": 2500,
      "folderUrl": "https://drive.google.com/..."
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "size": 20,
  "number": 0
}
```

### 2. Consultar um servico

`GET /acompanhamento-servicos/{id}`

Resposta:

```json
{
  "servico": {
    "id": 123,
    "origemId": 88,
    "tipoServico": "AVCB",
    "codigo": "AVCB-2026-001",
    "nomeCliente": "Cliente Exemplo",
    "telefone": "11999999999",
    "subtipo": "Projeto",
    "situacao": "EM_ANDAMENTO",
    "descricao": "Descricao geral do servico",
    "valorContrato": 15000,
    "dataContrato": "2026-03-13",
    "condicaoPagamento": "30/60",
    "aReceber": 8000,
    "recebido": 7000,
    "custos": 2500,
    "folderUrl": "https://drive.google.com/..."
  },
  "historico": [
    {
      "id": 9001,
      "situacaoAnterior": "PENDENTE",
      "novaSituacao": "EM_ANDAMENTO",
      "descricao": "Recebido retorno do cliente",
      "responsavelNome": "Vinicius Oliveira",
      "createdAt": "2026-03-10T14:30:00Z"
    }
  ]
}
```

### 3. Atualizar cadastro do servico

`PUT /acompanhamento-servicos/{id}`

Payload:

```json
{
  "nomeCliente": "Cliente Exemplo",
  "telefone": "11999999999",
  "tipoServico": "AVCB",
  "subtipo": "Renovacao",
  "descricao": "Descricao principal do cadastro",
  "valorContrato": 15000,
  "dataContrato": "2026-03-13",
  "condicaoPagamento": "30/60",
  "aReceber": 8000,
  "recebido": 7000,
  "custos": 2500,
  "folderUrl": "https://drive.google.com/..."
}
```

### 4. Atualizar situacao com historico

`POST /acompanhamento-servicos/{id}/situacao`

Payload:

```json
{
  "novaSituacao": "CONCLUIDO",
  "descricao": "Servico finalizado e aprovado"
}
```

Regra:

- backend deve registrar automaticamente:
  - situacao anterior
  - nova situacao
  - data/hora
  - usuario autenticado
  - descricao da mudanca

### 5. Listar configuracao de situacoes por tipo

`GET /acompanhamento-servicos/situacoes-config`

Resposta:

```json
{
  "AVCB": [
    { "id": 1, "nome": "PENDENTE", "ordem": 1, "situacaoInicial": true, "ativo": true },
    { "id": 2, "nome": "EM_ANDAMENTO", "ordem": 2, "situacaoInicial": false, "ativo": true }
  ],
  "CLCB": [],
  "OBRAS": [],
  "PROCESSOS_ADM": []
}
```

### 6. Criar situacao configuravel

`POST /acompanhamento-servicos/situacoes-config`

Payload:

```json
{
  "tipoServico": "AVCB",
  "nome": "AGUARDANDO_CLIENTE",
  "ordem": 3,
  "situacaoInicial": false
}
```

### 7. Atualizar situacao configuravel

`PUT /acompanhamento-servicos/situacoes-config/{id}`

Payload:

```json
{
  "nome": "EM_ANALISE",
  "ordem": 2,
  "situacaoInicial": false,
  "ativo": true
}
```

### 8. Excluir situacao configuravel

`DELETE /acompanhamento-servicos/situacoes-config/{id}`

Regra sugerida:

- nao excluir se a situacao estiver em uso
- alternativa: marcar `ativo=false`

### 9. Gerar PDF do servico

`GET /acompanhamento-servicos/{id}/relatorio-pdf`

Resposta:

- `application/pdf`

## Regras de negocio importantes

### Tempo na situacao

`tempoNaSituacao` deve ser calculado a partir de `ultimaMudancaSituacaoEm`.

### A receber

Preferencialmente calculado no backend:

`aReceber = valorContrato - recebido`

### Recebido

Deve vir da consolidacao dos lancamentos relacionados ao servico.

### Custos

Deve vir da soma dos custos indiretos ou custos vinculados ao servico.

### Codigo

Deve ser gerado automaticamente pelo backend.

## Integracao com entidades atuais

Existem 2 caminhos viaveis:

### Opcao A: tabela nova de acompanhamento

Criar uma tabela nova `acompanhamento_servicos` e sincronizar com:

- `avcbs`
- `clcbs`
- `obras`
- `processos_adm`

Vantagem:

- modelo unificado
- historico e configuracao ficam bem isolados

### Opcao B: view/agregacao sem tabela espelho

Manter os modulos atuais como origem e criar uma camada de agregacao com:

- endpoint unificado
- tabela de historico
- tabela de configuracao de situacoes
- tabela de metadados complementares

Vantagem:

- menos duplicacao

Desvantagem:

- mais complexidade de consulta

## Recomendacao

Implementar:

1. `GET /acompanhamento-servicos`
2. `GET /acompanhamento-servicos/{id}`
3. `PUT /acompanhamento-servicos/{id}`
4. `POST /acompanhamento-servicos/{id}/situacao`
5. CRUD de `situacoes-config`
6. `GET /acompanhamento-servicos/{id}/relatorio-pdf`

Com isso o frontend deixa de depender de `localStorage` para:

- situacoes configuraveis
- historico de situacao
- subtipo
- folderUrl
- descricao complementar

## Observacao final

Enquanto essa API nao existir, a tela atual funciona em modo hibrido:

- dados-base: backend atual
- configuracao/historico/metadados extras: frontend local

O ideal e migrar isso para backend assim que o endpoint `acompanhamento-servicos` estiver disponivel.
