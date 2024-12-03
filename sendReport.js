require('dotenv').config()

const nodemailer = require('nodemailer')
const path = require('path')
const fs = require('fs')
const { create } = require('html-pdf-chrome')
const puppeteer = require('puppeteer')

const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024 // 20MB em bytes

async function ensureDirectoryExists(directoryPath) {
  try {
    await fs.promises.mkdir(directoryPath, { recursive: true })
    console.warn(`Diretório criado ou já existe: ${directoryPath}`)
  } catch (error) { console.error('Erro ao criar diretório:', error) }
}

async function captureScreenshot(url, outputPath) {
  try {
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto(`file://${url}`, { waitUntil: 'networkidle2' })
    await page.screenshot({ path: outputPath, fullPage: true })

    await browser.close()
    console.debug('Screenshot capturada com sucesso:', outputPath)
  } catch (error) { console.error('Erro ao capturar screenshot:', error) }
}

async function sendEmailWithAttachment(pdfPath, screenshotPath, videoPath) {
  const attachments = [
    {
      filename: 'relatorio-cypress.pdf',
      path: pdfPath,
    },
    {
      filename: 'screenshot.png',
      path: screenshotPath,
    },
    {
      filename: 'video.mp4',
      path: videoPath,
    }
  ]

  const totalSize = await calculateTotalAttachmentSize(attachments)
  
  if (fs.existsSync(videoPath) && totalSize >= MAX_ATTACHMENT_SIZE) { attachments.pop() }
  else if (!fs.existsSync(videoPath)) { console.warn(`Arquivo de vídeo não encontrado: ${videoPath}`) }
  else { console.warn('O tamanho total dos anexos excede 20MB, vídeo não será anexado.') }

  const mailOptions = {
    from: process.env.EMAIL,
    to: 'dev.gabrielsouza@hotmail.com',
    subject: 'Relatório de Testes Cypress no NXLITE',
    html: '<h3>Segue o relatório de testes do Cypress</h3>',
    attachments,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.debug('E-mail enviado com sucesso:', info.response)
  } catch (error) {
    console.error('Erro ao enviar o e-mail:', error)
  }
}

async function checkCypressReportForErrors(htmlFilePath) {
  try {
    const htmlContent = await fs.promises.readFile(htmlFilePath, 'utf-8')
    return htmlContent.includes('failed')
  } catch (error) {
    console.error('Erro ao ler o relatório do Cypress:', error)
    return false
  }
}

async function convertHtmlToPdf(htmlFilePath, outputPdfPath) {
  try {
    const htmlContent = await fs.promises.readFile(htmlFilePath, 'utf-8')

    const options = {
      launchOptions: {
        headless: true,
        executablePath: '/usr/bin/google-chrome',
      },

      printOptions: {
        format: 'A4',
        landscape: true,
        printBackground: true,
        preferCSSPageSize: true,
      },
    }

    const pdf = await create(htmlContent, options)
    await pdf.toFile(outputPdfPath)
    console.debug('Relatório convertido para PDF com sucesso:', outputPdfPath)
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EISDIR') { console.debug('Erro ao gerar o PDF: Arquivo HTML não encontrado ou não é um arquivo válido! Possível teste sem falhas!') }
    else if (error.message.includes('failed to launch')) { console.warn('Erro ao gerar o PDF: Problema ao iniciar o navegador Chrome') }
    else if (!htmlFilePath || htmlContent.trim() === '') { console.warn('Erro ao gerar o PDF: Arquivo HTML vazio ou inválido') }
    else { console.error('Erro ao gerar o PDF:', error) }
  }
}

async function calculateTotalAttachmentSize(attachments) {
  let totalSize = 0

  for (const attachment of attachments) {
    try {
      const stats = await fs.promises.stat(attachment.path)
      totalSize += stats.size
    } catch (error) { console.error('Erro ao calcular o tamanho do anexo:', error) }
  }

  return totalSize
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,

  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
})

const reportsDir = path.resolve(__dirname, 'cypress/reports')
const reportPath = path.join(reportsDir, 'html', 'index.html')
const pdfDir = path.join(reportsDir, 'pdf')
const pdfPath = path.join(pdfDir, 'relatorio-cypress.pdf')
const videoDir = path.join(reportsDir, 'html/videos')
const videoPath = path.join(videoDir, '*.cy.js.mp4')
const screenshotPath = path.join(pdfDir, 'relatorio-cypress.png')

ensureDirectoryExists(pdfDir).then(async () => {
  const hasErrors = await checkCypressReportForErrors(reportPath)

  if (hasErrors) {
    await convertHtmlToPdf(reportPath, pdfPath)
    await captureScreenshot(reportPath, screenshotPath)

    if (!fs.existsSync(pdfPath)) {
      console.error('Erro: O arquivo PDF não foi gerado corretamente.')
      return
    }

    await sendEmailWithAttachment(pdfPath, screenshotPath, videoPath)
  } else { console.info('Nenhum erro encontrado nos testes do Cypress. Nenhum e-mail enviado.') }
})
