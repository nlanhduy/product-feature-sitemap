// Enhanced search utilities with exact word matching and synonym support
import Fuse from "fuse.js";

const thresholdForFuse = 0.1;
const minimumSearchLength = 3;

const searchUtils = {
  // Predefined synonym dictionary
  synonyms: {
    // Payment related
    payment: ["billing", "invoice", "checkout", "transaction", "purchase"],
    billing: ["payment", "invoice", "charge", "subscription"],
    checkout: ["payment", "purchase", "buy", "order"],

    // User related
    user: ["account", "profile", "member", "customer", "client"],
    account: ["user", "profile", "login", "signin"],
    profile: ["user", "account", "settings", "preferences"],

    // Authentication related
    auth: ["authentication", "login", "signin", "access", "security"],
    login: ["signin", "auth", "authentication", "access"],
    security: ["auth", "authentication", "protection", "safety"],

    // Interface related
    dashboard: ["overview", "summary", "home", "main", "control panel"],
    interface: ["ui", "frontend", "design", "layout"],
    navigation: ["menu", "nav", "routing", "links"],

    // Data related
    analytics: ["statistics", "metrics", "data", "reports", "insights"],
    database: ["storage", "data", "repository", "records"],
    api: ["service", "endpoint", "integration", "interface"],

    // Feature related
    feature: ["functionality", "capability", "tool", "option", "function"],
    notification: ["alert", "message", "update", "reminder", "notice"],
    search: ["find", "lookup", "query", "filter", "discover"],
  },

  // Get all synonyms for a word (including the word itself)
  getSynonyms: function (word) {
    const lowerWord = word.toLowerCase();
    const synonymList = this.synonyms[lowerWord] || [];
    return [lowerWord, ...synonymList];
  },

  // Check if text contains exact word match
  hasExactWordMatch: (text, searchWord) => {
    const words = text.toLowerCase().split(/\s+/);
    return words.includes(searchWord.toLowerCase());
  },

  // Check if text contains any synonym of the search word
  hasSynonymMatch: function (text, searchWord) {
    const synonyms = this.getSynonyms(searchWord);
    const textLower = text.toLowerCase();

    return synonyms.some((synonym) => {
      // Check for exact word match for each synonym
      const words = textLower.split(/\s+/);
      return words.includes(synonym);
    });
  },

  // Enhanced search function
  searchNodes: function (tree, query) {
    const results = [];
    const searchTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 0);

    const searchNode = (node) => {
      const searchableText =
        `${node.name || ""} ${node.description || ""}`.toLowerCase();
      const matchInfo = {
        node: node,
        matchType: null,
        matchedTerms: [],
        matchedSynonyms: [],
      };

      let hasMatch = false;

      // Check each search term
      for (const term of searchTerms) {
        let termMatched = false;

        // Check for exact word match
        if (this.hasExactWordMatch(searchableText, term)) {
          matchInfo.matchedTerms.push(term);
          matchInfo.matchType = "exact";
          termMatched = true;
          hasMatch = true;
        }

        // Check for synonym match if no exact match
        if (!termMatched && this.hasSynonymMatch(searchableText, term)) {
          const synonyms = this.getSynonyms(term);
          const matchedSynonym = synonyms.find((syn) =>
            this.hasExactWordMatch(searchableText, syn)
          );
          if (matchedSynonym) {
            matchInfo.matchedSynonyms.push({
              searchTerm: term,
              matchedSynonym,
            });
            matchInfo.matchType = matchInfo.matchType || "synonym";
            hasMatch = true;
          }
        }
      }

      if (hasMatch) {
        results.push(matchInfo);
      }

      // Search children
      if (node.children) {
        node.children.forEach(searchNode);
      }
    };

    searchNode(tree);

    // Sort results: exact matches first, then synonym matches
    return results.sort((a, b) => {
      if (a.matchType === "exact" && b.matchType === "synonym") return -1;
      if (a.matchType === "synonym" && b.matchType === "exact") return 1;
      return 0;
    });
  },
};

export default searchUtils;
