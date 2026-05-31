import React from "react";
import integrations from "@/content/settings/integrations.json";
import { Adsense } from "@ctrl/react-adsense";
import RelatedPostsContainer from "@/containers/RelatedPostsContainer";

const PostFooter = ({
  killSEO,
  adClient,
  promoNOread,
  relatedPosts,
  client,
  city,
  state,
  mainPostSlug,
}) => {
  // console.log(integrations);

  return (
    <div className="post-footer-wrapper">
      <div
        className={`ads footer-highlights ads-bottom-row ${
          promoNOread ? "none" : ""
        } ${!adClient ? "hidden" : ""}`}
      >
        {!promoNOread && !killSEO && adClient ? (
          <Adsense
            slot={integrations?.googleIntegration?.adsSlot}
            client={integrations?.googleIntegration?.adsClientID}
            style={{ display: "block", width: "750px", height: "120px" }}
            format="auto"
            layout="responsive"
          />
        ) : null}
      </div>
      <div
        className={`footer-highlights ${
          promoNOread || relatedPosts.length <= 6 ? "none" : ""
        }`}
      >
        <h2>Explore</h2>
        <hr className="small-row" />
        <div className="inner-footer-highlights">
          {relatedPosts.length >= 1 ? (
            <RelatedPostsContainer
              relatedPosts={relatedPosts}
              from={5}
              to={8}
              city={city}
              state={state}
              mainPostSlug={mainPostSlug}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PostFooter;
