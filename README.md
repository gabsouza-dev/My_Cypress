# Cypress + Github-Actions + SMTP 

Este repositório contém a configuração de testes automatizados com Cypress, incluindo o envio de relatórios de teste por e-mail com anexos, utilizando Node.js e bibliotecas específicas.

## Índice

- [Pré-requisitos](#pré-requisitos)
- [Como clonar o repositório](#como-clonar-o-repositório)
- [Instalação do Cypress](#instalação-do-cypress)
- [Funcionamento do `sendReport.js` e `.env`](#funcionamento-do-sendreportjs-e-env)
- [Relatório de Execução](#relatório-de-execução)
- [Scripts do repositório](#scripts-do-repositório)
- [GitHub Actions](#github-actions)

---

## Pré-requisitos

Certifique-se de ter instalado:
- Node.js (versão 14 ou superior)
- NPM (Node Package Manager)
- Cypress

---

## Como clonar o repositório

1. Abra o terminal e execute o seguinte comando para clonar o repositório:
   ```bash
   git clone https://github.com/GbrlSouza/cypress-with-email.git
   ```

2. Entre na pasta do projeto:
   ```bash
   cd cypress-with-email
   ```

---

## Instalação do Cypress

1. Instale as dependências do projeto:
   ```bash
   npm install
   ```

2. Instale o Cypress:
   ```bash
   npm install cypress --save-dev
   ```

---

## Funcionamento do `sendReport.js` e `.env`

### `sendReport.js`

Este script realiza as seguintes tarefas:
1. **Verifica erros no relatório do Cypress**: Lê o arquivo HTML gerado pelo Cypress para identificar falhas.
2. **Converte HTML em PDF**: Caso erros sejam encontrados, converte o relatório HTML em um PDF formatado.
3. **Envia o relatório por e-mail**: Usa o Nodemailer para enviar o PDF e um vídeo de teste por e-mail.

Bibliotecas necessárias:
- **dotenv**: Carrega as variáveis de ambiente do arquivo `.env`.
- **nodemailer**: Envia e-mails.
- **html-pdf-chrome**: Converte HTML em PDF.
- **path** e **fs** (nativas do Node.js): Manipulam arquivos e diretórios.

### Configuração do `.env`

Crie um arquivo `.env` na raiz do projeto e adicione as seguintes variáveis:
```env
EMAIL=seu-email@gmail.com
PASSWORD=sua-senha-ou-token
```

**Atenção:** Para contas do Gmail, ative a configuração de aplicativos menos seguros ou utilize um token de autenticação.

---

## Relatório de Execução

Ao executar o comando `npm run test`, você verá o seguinte relatório no terminal:

```bash
> cypress_with_email@1.0.0 test
> cypress run && node sendReport.js

...

  Tests:        6
  Passing:      6
  Failing:      0
  Pending:      0
  Skipped:      0

...

Relatório convertido para PDF com sucesso: C:\cypress_with_email\cypress\reports\pdf\relatorio-cypress.pdf
E-mail enviado com sucesso: 250 2.0.0 OK
```

### Explicação do Relatório:

1. **Execução dos Testes**:
   - O Cypress executa todos os testes no arquivo `todo.cy.js`.
   - Mostra o número total de testes executados, quantos passaram e se houve falhas.

2. **Geração de Relatórios**:
   - O relatório JSON gerado pelo Cypress é convertido em um relatório HTML com detalhes dos testes.
   - O relatório HTML é armazenado em `cypress/reports/html/index.html`.

3. **Conversão para PDF**:
   - Caso erros sejam encontrados nos testes, o HTML é convertido em um arquivo PDF armazenado em `cypress/reports/pdf/relatorio-cypress.pdf`.

4. **Envio de E-mail**:
   - O relatório PDF e o vídeo de execução dos testes são enviados para o e-mail configurado no `.env`.

---

## Scripts do repositório

O arquivo `package.json` possui o seguinte script para rodar os testes e enviar relatórios automaticamente:
```json
"scripts": {
    "test": "cypress run && node sendReport.js"
}
```

### Executar o script manualmente

1. Para rodar os testes e enviar o relatório, utilize:
   ```bash
   npm run test
   ```

---

## GitHub Actions

Este repositório suporta integração contínua com GitHub Actions. Certifique-se de configurar um workflow para rodar os testes com o script acima. Um exemplo de configuração YAML:

```yaml
name: Run Cypress Tests

on:
  push:
    branches:
      - main

jobs:
  cypress-test:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout repository
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'

    - name: Install dependencies
      run: npm install

    - name: Run Cypress Tests and Send Report
      run: |
          node sendReport.js 
```

---

Com isso, o repositório estará pronto para rodar testes automatizados, gerar relatórios e enviar notificações por e-mail!
