// Used by buildProxyBypassRegexFromEnv for escaping dot symbols in NO_PROXY hosts' strings
export const searchRegExpToReplaceSpecialChars: RegExp = new RegExp('(?<!\\\\)([.])(?!\\*)', 'g');
