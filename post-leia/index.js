import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Head from "next/head";
import dynamic from "next/dynamic";
import Image from "next/image";

import postsDataJSON from "@/content/cache/postsDatas.json";
import general from "@/content/settings/general.json";
import integrations from "@/content/settings/integrations.json";
import theme from "@/content/settings/theme.json";
import business from "@/content/settings/business.json";
import logos from "@/content/settings/logos.json";

import SeoContainer from "@/containers/SeoContainer";
// import BlogList from "@/containers/BlogListContainer";
const BlogList = dynamic(() => import("../containers/BlogListContainer"));

import HeaderContainer from "@/containers/HeaderContainer";
import FooterContainer from "@/containers/FooterContainer";
import SearchInputContainer from "@/containers/SearchInputContainer";

const brandCardImage = logos.cardLogo?.includes("http")
  ? logos.cardLogo
  : general?.scope + "/" + logos.cardLogo;

const infos = {
  slug: "",
  title: `${"Home"} - ${business?.brandName}`,
  description: business?.brandDescription,
  author: business?.brandName,
  brandPerson: business?.brandName,
  featuredImage: brandCardImage,
  questions: [],
  topology: "page",
  articleUrl: general?.siteUrl,
};

const Home = () => {
  const [btnGClick, handleBtnGClick] = useState(null);
  const [userInfos, setUserInfos] = useState(null);
  const [city, setCity] = useState(null);
  const [state, setState] = useState(null);
  // const [searchClick, setSearchClick] = useState(null);
  const pathnameVAR = usePathname();
  const pathname = pathnameVAR === "/" ? "home" : pathnameVAR.slice(1, -1);
  const posts = postsDataJSON.filter((fps) => new Date(fps.date) <= new Date());
  const cleanedPosts = posts.filter(
    (e) => e.frontmatter?.featuredPost === false
  );
  const featuredPosts = posts.filter(
    (e) => e.frontmatter?.featuredPost === true
  );
  let arrPosts = featuredPosts;
  if (featuredPosts.length <= 10) {
    arrPosts = featuredPosts
      .concat(cleanedPosts)
      .slice(0, theme?.postsSettings?.postsToShow || 10);
  }
  const featuredImages = posts
    .map((fi) => fi.featuredImage)
    .slice(0, theme?.postsSettings?.postsToShow || 10);

  const fetchApiData = async () => {
    const res = await fetch(`${general?.scope}/geolocation`);
    const data = await res.json();
    // setMensen(data);
    setUserInfos(data);
    setState(data?.geo?.subdivision?.name || "California");
    return setCity(data?.geo?.city || "Los Angeles");
  };
  const adClient =
    integrations?.googleIntegration?.adsClientID === "" ||
    integrations?.googleIntegration?.adsClientID === "ca-pub-"
      ? false
      : true;
  // Pass data to the page via props
  const gtagCounter = (id) => {
    if (btnGClick === null && typeof window !== "undefined" && adClient) {
      window?.gtag("event", id);
      handleBtnGClick(null);
    }
  };
  useEffect(() => {
    // Fetch data from API if `location` object is set
    if (!city || !state) {
      fetchApiData()
        .then(function (response) {
          if (!response.ok) {
            return null;
          }
        })
        .catch(function () {
          return null;
        });
    }
  }, [city, state]);
  return (
    <div className="index-page">
      <Head>
        {featuredImages.forEach((fif) => (
          <link rel="preload" href={fif} as="image" />
        ))}
      </Head>
      <SeoContainer killSeo={false} data={infos} />
      <div className="page-wrapper">
        <HeaderContainer
          opt={{
            bgOne: "transparent",
            bgTwo: "transparent",
            classes: "header-block",
            pageHasMenu: true,
          }}
          hasMenu={false}
          gtag={"gtag"}
          gtagCounter={gtagCounter}
          pathname={pathname}
        />
        <div className="hero-wrapper">
          <div className="hero search-hero">
            <Image
              src={`/brandimages/hero-img.jpg`}
              alt={"Hero image"}
              width={1024}
              height={650}
              className="hero-img"
            />
            <div className="row-config inner-hero">
              <h1>Search {business?.brandName}</h1>
              <SearchInputContainer />
            </div>
          </div>
        </div>
        <main className="main-container-wrapper">
          <div className="main-container main-page">
            <div className="news-grid">
              <BlogList
                posts={arrPosts}
                postsToShow={theme?.postsSettings?.postsToShow || 9}
                city={city || "Los Angeles"}
                state={state || "CA"}
              />
            </div>
          </div>
        </main>
      </div>

      <div className="wrapper-box"></div>
      <FooterContainer />
    </div>
  );
};
export default Home;
