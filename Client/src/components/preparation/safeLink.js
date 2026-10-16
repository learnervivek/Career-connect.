/**
 * Validates and returns safe HTML anchor attributes for external URLs.
 * Ensures the link strictly uses http:// or https:// and prevents
 * script execution, javascript: schemes, or insecure tab access.
 */
export const getSafeExternalLinkProps = (url) => {
    if (!url || typeof url !== "string") {
        return {
            href: "#",
            onClick: (e) => e.preventDefault(),
            rel: "noopener noreferrer",
        };
    }

    const trimmed = url.trim();
    const isValidHttp = /^https?:\/\//i.test(trimmed);

    if (!isValidHttp) {
        return {
            href: "#",
            onClick: (e) => e.preventDefault(),
            rel: "noopener noreferrer",
        };
    }

    return {
        href: trimmed,
        target: "_blank",
        rel: "noopener noreferrer",
    };
};

export const isValidHttpUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    return /^https?:\/\//i.test(url.trim());
};
