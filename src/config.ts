import CrawlConfig from "./CrawlConfig";

export const managedCloud10Paas: CrawlConfig = {
  rootUrl:
    "https://doc.sitecore.com/xp/en/developers/100/managed-cloud/sitecore-cloud-services-overview.html",
  outputPath: `${process.cwd()}/out/`,
  filename: "managed-cloud-10-paas.md",
};

export const managedCloud10PaasSLA: CrawlConfig = {
  rootUrl:
    "https://support.sitecore.com/kb?id=kb_article_view&sysparm_article=KB0133931",
  outputPath: `${process.cwd()}/out-sla/`,
  filename: "managed-cloud-10-paas-sla.md",
  subPages: [
    "https://support.sitecore.com/kb?id=kb_article_view&sysparm_article=KB0463549",
    "https://support.sitecore.com/kb?id=kb_article_view&sysparm_article=KB0137210",
    "https://support.sitecore.com/kb?id=kb_article_view&sysparm_article=KB0633809",
    "https://support.sitecore.com/kb?id=kb_article_view&sysparm_article=KB0152132",
  ],
};
