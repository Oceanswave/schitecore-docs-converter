import CrawlConfig from "./CrawlConfig";

export const managedCloud10Paas: CrawlConfig = {
  rootUrl:
    "https://doc.sitecore.com/xp/en/developers/100/managed-cloud/sitecore-cloud-services-overview.html",
  outputPath: `${process.cwd()}/out/`,
  filename: "managed-cloud-10-paas.md",
};
