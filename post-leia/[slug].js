import React from "react";
import slugify from "slugify";

import pagesData from "@/content/cache/allPagesData.json";
import postsData from "@/content/cache/allPostsData.json";

import { getDataBySlug } from "../lib/getDatas";
import markdownToHtml from "../lib/markdownToHtml";
import SinglePost from "../templates/single-post";
import SinglePage from "../templates/single-page";
import CategoryPage from "../templates/category-page";

const Post = (mdFile) => {
  if (mdFile.content === "") {
    return <CategoryPage post={mdFile} />;
  }
  if (mdFile?.parentFolder?.includes("posts")) {
    return <SinglePost post={mdFile} draftMode={false} />;
  }
  if (mdFile?.parentFolder?.includes("pages")) {
    return <SinglePage page={mdFile} draftMode={false} />;
  }
  return <SinglePost post={mdFile} draftMode={false} />;
};

export default Post;

export const getStaticProps = async (context) => {
  if (!context) {
    throw new Error("Error: No !context!");
  }
  if (!context.params) {
    throw new Error("Error: No !context.params!");
  }

  const slug = context.params.slug;
  if (!slug) {
    throw new Error("Error: No !slug!");
  }

  const mdFileData = getDataBySlug(slug);

  let content = await markdownToHtml(mdFileData?.content || "");

  return {
    props: {
      ...mdFileData,
      content,
    },
  };
};

export const getStaticPaths = async () => {
  // console.log("Creating routes...");

  const postsSlugs = [
    ...new Set(postsData.allPosts.map((po) => po?.slug).flat()),
  ];
  const pagesSlugs = [
    ...new Set(pagesData.allPages.map((pa) => pa?.slug).flat()),
  ];
  const categories = postsData.categories.map(
    (cat) => (cat = slugify(cat).toLowerCase())
  );

  const concatPaths = postsSlugs.concat(pagesSlugs).concat(categories);
  let paths = [];
  concatPaths.forEach((cat) => {
    paths.push({ params: { slug: cat } });
  });
  return {
    paths,
    fallback: false,
  };
};
