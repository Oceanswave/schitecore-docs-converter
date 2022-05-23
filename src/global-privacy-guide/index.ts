import path from "path";

import puppeteer from "puppeteer";
import fs from "fs-extra";
import TurndownService from "turndown";
import { gfm } from "joplin-turndown-plugin-gfm";
import cheerio from "cheerio";

import CrawlConfig from "../CrawlConfig";
import { globalPrivacyGuide } from "../config";
import fixTables from "../fixTables";

async function generateDocumentation(config: CrawlConfig) {
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
    if (url.startsWith("https://www.google-analytics.com")) {
      return;
    }

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
  await page.goto(config.rootUrl);

  // Find all links to articles
  const pageUrls = await page.evaluate(() => {
    const stuff: string[] = [];
    $("li.opened")
      .find("a.topic-link")
      .each(function () {
        stuff.push((this as HTMLAnchorElement).href);
      });
    return stuff;
  });

  console.log(`Found ${pageUrls.length} pages to crawl`);
  const outputMarkdown = [];
  for (const pageUrl of pageUrls) {
    console.log(`Crawling ${pageUrl}`);
    await page.goto(pageUrl);
    // await page.screenshot({ path: `${outputFolder}/${targetPage.filename}` });

    const articleSelector = "article";
    await page.waitForSelector(articleSelector);
    const pageContent = await page.$eval(articleSelector, (el) => el.innerHTML);

    const $ = cheerio.load(pageContent);

    // Set the title to be a link to the page
    $("h1.title").wrapInner('<a href="' + pageUrl + '"></a>');

    // Remove the current version and abstract headers
    $('div[id="current-version"]').remove();
    $("div.abstract").remove();

    // Remove the collapsing sections
    $("a[data-toggle]").replaceWith(function () {
      return $(this).html() || "";
    });

    // Fix tables in content
    fixTables($);

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
generateDocumentation(globalPrivacyGuide).then(() => {
  console.log("All Done!");
});
