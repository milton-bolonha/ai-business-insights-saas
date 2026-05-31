import React from "react";
import integrations from "@/content/settings/integrations.json";
import { Adsense } from "@ctrl/react-adsense";
import RelatedPostsContainer from "@/containers/RelatedPostsContainer";

const PostRightColumn = ({
  relatedPosts,
  promoVisitState,
  readMore,
  promoNOread,
  killSEO,
  adClient,
  client,
  city,
  state,
  mainPostSlug,
}) => (
  <section
    className={`right-column ${promoNOread ? "none" : ""} ${
      !adClient && relatedPosts?.length < 1 ? "hidden" : ""
    }`}
  >
    <div
      className={`ads ads-right-column ${promoNOread ? "none" : ""}             
              `}
    >
      {!promoNOread && !killSEO && adClient ? (
        <Adsense
          slot={integrations?.googleIntegration?.adsSlot || ""}
          client={integrations?.googleIntegration?.adsClientID || ""}
          style={{ display: "block", width: "300px", height: "300px" }}
          format="auto"
          layout="responsive"
        />
      ) : null}
    </div>
    <div
      className={`desktop-only ${
        promoNOread || relatedPosts.length <= 1 ? "none" : ""
      }`}
    >
      <h2>Related Posts</h2>
      <hr className="small-row" />
      <div className="inner-right-column">
        <RelatedPostsContainer
          relatedPosts={relatedPosts}
          from={0}
          to={4}
          city={city}
          state={state}
          mainPostSlug={mainPostSlug}
        />
      </div>
    </div>

    <div
      className={`ads ads-right-column second ${promoNOread ? "none" : ""}
              ${
                promoVisitState === false && readMore === true ? "" : "sticky"
              }`}
    >
      {!promoNOread && !killSEO && adClient ? (
        <Adsense
          slot={integrations?.googleIntegration?.adsSlot || ""}
          client={integrations?.googleIntegration?.adsClientID || ""}
          style={{ display: "block", width: "300px", height: "300px" }}
          format="auto"
          layout="responsive"
        />
      ) : null}
    </div>
  </section>
);

export default PostRightColumn;
