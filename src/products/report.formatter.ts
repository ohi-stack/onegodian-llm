export const formatAsProduct = (content: string) => {
  return {
    title: "Onegodian Monetization Strategy Report",
    generatedAt: new Date().toISOString(),
    content,
    license: "Single-User License",
    priceSuggestion: "$49 - $199"
  };
};
