export async function renderPdf(url: string) {
  let puppeteer: typeof import("puppeteer")
  try {
    puppeteer = await import("puppeteer")
  } catch {
    throw new Error("Puppeteer is not installed, so PDF export is unavailable.")
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })
  try {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60_000 })
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
