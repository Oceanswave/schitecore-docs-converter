import path from "path";
import { URL } from "url";

import puppeteer from "puppeteer";
import fs from "fs-extra";
import TurndownService from "turndown";
import { gfm } from "joplin-turndown-plugin-gfm";
import cheerio from "cheerio";

import CrawlConfig from "../CrawlConfig";
import { managedCloud10PaasSLA } from "../config";

async function generateSupportDocumentation(config: CrawlConfig) {
  await fs.ensureDir(config.outputPath);
  const turndownService = new TurndownService();
  turndownService.use(gfm);

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  page.on("response", async (response) => {
    const url = response.url();
    if (response.request().resourceType() !== "image") {
      return;
    }

    const requestUrl = response.request().initiator().url || "";
    const file = await response.buffer();

    //Get the relative path of the request url
    const relativePath = path.relative(requestUrl, url).replaceAll("../", "");
    const fileName = relativePath.split("/").pop() || "image.png";
    const pathName = relativePath.split("/").slice(0, -1).join("/");
    await fs.ensureDir(path.join(config.outputPath, pathName));

    const filePath = path.resolve(`${config.outputPath}/${pathName}`, fileName);
    const writeStream = fs.createWriteStream(filePath);
    writeStream.write(file);
  });

  const supportPageUrls = [config.rootUrl, ...(config.subPages || [])];

  console.log(`Found ${supportPageUrls.length} pages to crawl`);
  const outputMarkdown = [];
  for (const pageUrl of supportPageUrls) {
    // Get the base path of the page
    const parsedUrl = new URL(pageUrl);
    const basePath = `${parsedUrl.protocol}//${parsedUrl.host}`;

    console.log(`Crawling ${pageUrl}`);
    await page.goto(pageUrl);

    const articleTitleSelector = "div.s_kb-article-title";
    const articleSelector = "article";
    await page.waitForSelector(articleSelector);
    const pageTitle = await page.$eval(
      articleTitleSelector,
      (el) => el.textContent
    );
    const pageContent = await page.$eval(articleSelector, (el) => el.innerHTML);

    const $ = cheerio.load(pageContent);

    // Add the title as a link to the page
    $("section").prepend(
      `<h1><a href="${pageUrl}">${pageTitle?.trim()}</a></h1>`
    );
    $("div.s_kv-article-title").wrapInner('<a href="' + pageUrl + '"></a>');

    // Remove the article bar
    $("div.s_kb-article-bar").remove();

    // Remove inline styles
    $("style").remove();

    // Replace relative links with absolute links
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      if (href && href.startsWith("/")) {
        $(el).attr("href", `${basePath}${href}`);
      }
    });

    const pageContentMarkdown = turndownService.turndown($.html());
    outputMarkdown.push(pageContentMarkdown);
  }

  await page.close();
  await browser.close();

  await fs.writeFile(
    `${config.outputPath}/${config.filename}`,
    outputMarkdown.join("\n\n")
  );
}

console.log("Processing...");
generateSupportDocumentation(managedCloud10PaasSLA).then(() => {
  console.log("All Done!");
});
