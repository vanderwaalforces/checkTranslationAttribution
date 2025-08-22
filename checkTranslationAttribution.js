// @name        Wikipedia translation attribution checker
// @namespace   https://en.wikipedia.org/
// @version     1.5.1
// @description Checks if a page is a potential unattributed translation, has suspicious access dates, or was created using the ContentTranslation tool.
// @author      [[User:Vanderwaalforces]]
// @match       https://en.wikipedia.org/wiki/*
// @match       https://en.wikipedia.org/w/index.php?title=*

(function() {
    'use strict';

    // Function to load the external CSS file
    function loadCSS(href, id = '') {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = href;
        if (id) link.id = id; // Optional ID for the link element
        document.head.appendChild(link);
    }

    // Load the default CSS first
    loadCSS('/w/index.php?title=User:Vanderwaalforces/checkTranslationAttribution.css&action=raw&ctype=text/css', 'defaultCTAStyles');
    
    // Configurable margin in days for offline work
    const OFFLINE_WORK_MARGIN_DAYS = 7;

    // Ensure the script only runs in mainspace (0) or draftspace (118)
    const namespace = mw.config.get('wgNamespaceNumber');
    if (namespace !== 0 && namespace !== 118) return;

    const apiUrl = "https://en.wikipedia.org/w/api.php";
    const pageTitle = mw.config.get('wgPageName');
    const talkPageTitle = "Talk:" + pageTitle;

    // List of valid two-, three-, five- and six-letter language codes for interwiki links
	const validLanguageCodes = [
    	'aa', 'ab', 'ace', 'ady', 'af', 'ak', 'als', 'alt', 'am', 'ami', 'an', 'ang', 'ar', 'arc', 'ary', 'arz', 'as', 'ast',
    	'atj', 'av', 'avk', 'awa', 'ay', 'az', 'azb', 'ba', 'ban', 'bar', 'bat-smg', 'bcl', 'be', 'be-tarask', 'be-x-old',
    	'bg', 'bh', 'bi', 'bjn', 'blk', 'bm', 'bn', 'bo', 'bpy', 'br', 'bs', 'bug', 'bxr', 'ca', 'cbk-zam', 'cdo', 'ce',
    	'ceb', 'ch', 'cho', 'chr', 'chy', 'ckb', 'co', 'cr', 'crh', 'cs', 'csb', 'cu', 'cv', 'cy', 'da', 'dag', 'de', 'din',
    	'diq', 'dsb', 'dty', 'dv', 'dz', 'ee', 'el', 'eml', 'eo', 'es', 'et', 'eu', 'ext', 'fa', 'ff', 'fi', 'fiu-vro',
    	'fj', 'fo', 'fr', 'frp', 'frr', 'fur', 'fy', 'ga', 'gag', 'gan', 'gcr', 'gd', 'gl', 'glk', 'gn', 'gom', 'gor', 'got',
    	'gu', 'guw', 'gv', 'ha', 'hak', 'haw', 'he', 'hi', 'hif', 'ho', 'hr', 'hsb', 'ht', 'hu', 'hy', 'hyw', 'hz', 'ia',
    	'id', 'ie', 'ig', 'ii', 'ik', 'ilo', 'inh', 'io', 'is', 'it', 'iu', 'ja', 'jam', 'jbo', 'jv', 'ka', 'kaa', 'kab',
    	'kbd', 'kbp', 'kcg', 'kg', 'ki', 'kj', 'kk', 'kl', 'km', 'kn', 'ko', 'koi', 'kr', 'krc', 'ks', 'ksh', 'ku', 'kv',
    	'kw', 'ky', 'la', 'lad', 'lb', 'lbe', 'lez', 'lfn', 'lg', 'li', 'lij', 'lld', 'lmo', 'ln', 'lo', 'lrc', 'lt', 'ltg',
    	'lv', 'mad', 'mai', 'map-bms', 'mdf', 'mg', 'mh', 'mhr', 'mi', 'min', 'mk', 'ml', 'mn', 'mni', 'mnw', 'mo', 'mr',
    	'mrj', 'ms', 'mt', 'mus', 'mwl', 'my', 'myv', 'mzn', 'na', 'nah', 'nap', 'nds', 'nds-nl', 'ne', 'new', 'ng', 'nia',
    	'nl', 'nn', 'no', 'nov', 'nqo', 'nrm', 'nso', 'nv', 'ny', 'oc', 'olo', 'om', 'or', 'os', 'pa', 'pag', 'pam', 'pap',
    	'pcd', 'pcm', 'pdc', 'pfl', 'pi', 'pih', 'pl', 'pms', 'pnb', 'pnt', 'ps', 'pt', 'pwn', 'qu', 'rm', 'rmy', 'rn', 'ro',
		'roa-rup', 'roa-tara', 'ru', 'rue', 'rw', 'sa', 'sah', 'sat', 'sc', 'scn', 'sco', 'sd', 'se', 'sg', 'sh', 'shi',
    	'shn', 'shy', 'si', 'simple', 'sk', 'skr', 'sl', 'sm', 'smn', 'sn', 'so', 'sq', 'sr', 'srn', 'ss', 'st', 'stq', 'su',
    	'sv', 'sw', 'szl', 'szy', 'ta', 'tay', 'tcy', 'te', 'tet', 'tg', 'th', 'ti', 'tk', 'tl', 'tn', 'to', 'tpi', 'tr',
    	'trv', 'ts', 'tt', 'tum', 'tw', 'ty', 'tyv', 'udm', 'ug', 'uk', 'ur', 'uz', 've', 'vec', 'vep', 'vi', 'vls', 'vo',
    	'wa', 'war', 'wo', 'wuu', 'xal', 'xh', 'xmf', 'yi', 'yo', 'yue', 'za', 'zea', 'zh', 'zh-classical', 'zh-min-nan',
    	'zh-yue', 'zu'
	];

    // Function to fetch edit summaries and the first revision date (first 100 revisions)
    function fetchEditSummaries() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: apiUrl,
                data: {
                    action: "query",
                    format: "json",
                    prop: "revisions",
                    titles: pageTitle,
                    rvprop: "comment|timestamp",
                    rvlimit: 100,
                    origin: "*"
                },
                success: function(data) {
                    const pages = data.query.pages;
                    const revisions = pages[Object.keys(pages)[0]].revisions;
                    const firstRevisionDate = revisions[revisions.length - 1].timestamp;
                    const comments = revisions.map(rev => rev.comment);

                    // Log the fetched comments and first revision date for debugging
                    console.log("Fetched edit summaries:", comments);
                    console.log("First revision date (from 100 revisions):", firstRevisionDate);

                    resolve({ comments, firstRevisionDate });
                },
                error: function(err) {
                    reject(err);
                }
            });
        });
    }

    // Function to fetch the very first revision of the article (creation edit)
    function fetchFirstRevision() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: apiUrl,
                data: {
                    action: "query",
                    format: "json",
                    prop: "revisions",
                    titles: pageTitle,
                    rvprop: "comment|tags|timestamp",  // Include timestamp to get the creation date
                    rvdir: "newer",  // Fetch from the oldest revision
                    rvlimit: 1,      // Only fetch the first revision
                    origin: "*"
                },
                success: function(data) {
                    const pages = data.query.pages;
                    const revisions = pages[Object.keys(pages)[0]].revisions;
                    const firstRevision = revisions[0]; // Get the first revision
                    console.log("First revision fetched:", firstRevision);
                    resolve(firstRevision);  // Now includes the creation timestamp
                },
                error: function(err) {
                    reject(err);
                }
            });
        });
    }

    // Function to fetch article wikitext for citation checks
    function fetchWikitext() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: apiUrl,
                data: {
                    action: "query",
                    format: "json",
                    prop: "revisions",
                    titles: pageTitle,
                    rvprop: "content",
                    origin: "*"
                },
                success: function(data) {
                    const pages = data.query.pages;
                    const pageData = pages[Object.keys(pages)[0]];
                    if (pageData.revisions && pageData.revisions[0]) {
                        const wikitext = pageData.revisions[0]['*'];

                        // Log the wikitext for debugging
                        console.log("Fetched wikitext:", wikitext);

                        resolve(wikitext);
                    } else {
                        console.log("No wikitext found");
                        resolve(null);  // Return null if wikitext is missing
                    }
                },
                error: function(err) {
                    reject(err);
                }
            });
        });
    }

    // Function to check if talk page contains the word "translat"
    function fetchTalkPageContent() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: apiUrl,
                data: {
                    action: "query",
                    format: "json",
                    prop: "revisions",
                    titles: talkPageTitle,
                    rvprop: "content",
                    origin: "*"
                },
                success: function(data) {
                    const pages = data.query.pages;
                    const revisions = pages[Object.keys(pages)[0]].revisions;
                    if (revisions && revisions[0] && revisions[0]['*']) {
                        const talkPageContent = revisions[0]['*'].toLowerCase();
                        
                        // Log the talk page content for debugging
                        console.log("Fetched talk page content:", talkPageContent);

                        resolve(talkPageContent.includes("translat"));
                    } else {
                        resolve(false);
                    }
                },
                error: function(err) {
                    reject(err);
                }
            });
        });
    }

    // Helper function to check if a comment contains a valid interwiki link
    function containsInterwikiLink(comment) {
        const interwikiRegex = new RegExp(`\\b(${validLanguageCodes.join('|')}):`, 'i');
        return interwikiRegex.test(comment);
    }

    // Helper function to check if an edit summary contains both "translat" or "import" and "from"
    function containsTranslationKeywords(comment) {
        const lowerComment = comment.toLowerCase();
        const hasTranslatAndFrom = lowerComment.includes("translat") && lowerComment.includes("from");
        const hasImportedAndFrom = lowerComment.includes("imported") && lowerComment.includes("from");
        const hasImportingAndFrom = lowerComment.includes("importing") && lowerComment.includes("from");

        // Log the status of each summary's keyword check
        console.log(`Summary: ${comment}, Has translat + from: ${hasTranslatAndFrom}, Has imported + from: ${hasImportedAndFrom}, Has importing + from: ${hasImportingAndFrom}`);

        return hasTranslatAndFrom || hasImportedAndFrom || hasImportingAndFrom;
    }

    // Function to classify edit summaries based on the refined algorithm
    function classifyEditSummaries(editSummaries) {
        let hasTranslatNoInterwiki = false;
        let hasTranslatWithInterwiki = false;

        editSummaries.forEach(summary => {
            if (containsTranslationKeywords(summary)) {
                const hasInterwiki = containsInterwikiLink(summary);
                if (hasInterwiki) {
                    hasTranslatWithInterwiki = true;
                } else {
                    hasTranslatNoInterwiki = true;
                }
            }
        });

        return { hasTranslatNoInterwiki, hasTranslatWithInterwiki };
    }

    // Improved date regex to handle various date formats
    function parseDate(dateString) {
        const regexes = [
            /\b(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s(\d{4})\b/,  // e.g. "21 January 2024"
            /\b(\d{4})-(\d{2})-(\d{2})\b/,  // e.g. "2024-01-21"
            /\b(\d{1,2})-(\d{1,2})-(\d{4})\b/,  // e.g. "21-01-2024"
            /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{1,2}),?\s(\d{4})\b/  // e.g. "January 21, 2024"
        ];

        for (const regex of regexes) {
            const match = regex.exec(dateString);
            if (match) {
                return new Date(match[0]);
            }
        }
        return null;  // Return null if no valid date format is found
    }

    function addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    
    // Function to check for suspicious access dates in the article's wikitext
    function checkSuspiciousAccessDates(wikitext, firstRevisionDate) {
        if (!wikitext) {
            console.log("No wikitext to check for access dates");
            return false;
        }

        const accessDateRegex = /\|\s*access[- ]date\s*=\s*([A-Za-z0-9, -]+)/g;
        const matches = [...wikitext.matchAll(accessDateRegex)];
        const suspiciousDates = [];

        const firstRevisionParsed = new Date(firstRevisionDate);
        const marginDate = addDays(firstRevisionParsed, -OFFLINE_WORK_MARGIN_DAYS);

        matches.forEach(match => {
            const accessDate = match[1];
            const accessDateParsed = parseDate(accessDate);
            if (accessDateParsed) {
                if (accessDateParsed < marginDate) {
                    suspiciousDates.push(accessDate);
                }
            }
        });

		// Log any suspicious dates for debugging
        console.log("Suspicious access dates:", suspiciousDates);
        return suspiciousDates.length > 0;
    }

    // Function to display a message before the #contentSub element, with a dismiss button in the top-right corner
    function displayMessage(text, className) {
        const messageDiv = document.createElement("div");
        messageDiv.className = `${className} cTA_banner`; // Add a general class and the specific type
        messageDiv.innerHTML = text;  // Use innerHTML for parsing link elements

        const docLink = document.createElement("a");
        docLink.className = "cTA_docLink"; 
        docLink.href = "https://en.wikipedia.org/wiki/User:Vanderwaalforces/checkTranslationAttribution";
        docLink.target = "_blank";
        docLink.title = "Help";
        docLink.style.color = "#ffffff";
        docLink.innerHTML = '&#9432;';  // Info symbol
        messageDiv.appendChild(docLink);

        // Add dismiss button at the very top-right corner
        const dismissButton = document.createElement("button");
        dismissButton.className = "cTA_dismiss"; // Use a class for the button as well
        dismissButton.innerHTML = "&cross;"; // ✗ symbol
        dismissButton.title = "Close";
        dismissButton.onclick = () => {
            messageDiv.style.display = "none";
        };
        messageDiv.appendChild(dismissButton);

        // Insert the message before the #contentSub element to make it compatible with all skins
        document.querySelector('#contentSub').insertAdjacentElement('beforebegin', messageDiv);
    }

    // Main logic
    async function checkTranslationAttribution() {
        try {
            // Fetch the first revision to check for ContentTranslation tool and creation date
            const firstRevision = await fetchFirstRevision();
            const firstComment = firstRevision.comment;
            const firstTags = firstRevision.tags;
            const firstRevisionDate = firstRevision.timestamp;  // Fetch the timestamp of the first revision
            
            // Define the constants for links to WP:TFOLWP and the Translated from template
        	const wpShortcutLink = mw.html.element('a', {
            	href: '/wiki/WP:TFOLWP',
            	target: '_blank',
            	class: 'cTA_link_scut'
        	}, 'WP:TFOLWP');
        
        	const templateLink = mw.html.element('a', {
            	href: '/wiki/Template:Translated_from',
            	target: '_blank',
            	class: 'cTA_link_tplt'
        	}, '{{Translated from}}'); 

            // If the first edit used the ContentTranslation tool, display the green banner and skip other checks
            if (firstComment.includes("Created by translating the page") && firstTags.includes("contenttranslation")) {
                const contentTranslationLink = mw.html.element('a', {
                    href: 'https://www.mediawiki.org/wiki/Special:MyLanguage/Content_translation',
                    target: '_blank',
                    class: 'cTA_link_ctl'
                }, 'ContentTranslation');
                
                displayMessage(
                    `This article was created using the ${contentTranslationLink} module and is correctly attributed to the source Wikipedia.`,
                    "cTA_info_talk"
                );
                return; // Skip all other checks if ContentTranslation tool was used
            }

            // Continue with other checks for suspicious access dates and translation attribution
            const { comments } = await fetchEditSummaries();  // Use only for edit summaries now
            const { hasTranslatNoInterwiki, hasTranslatWithInterwiki } = classifyEditSummaries(comments);

            const wikitext = await fetchWikitext();
            const hasSuspiciousAccessDates = checkSuspiciousAccessDates(wikitext, firstRevisionDate);  // Use actual creation date

            // Display singular orange banner if there are suspicious access dates (no translation detected)
            if (hasSuspiciousAccessDates && !hasTranslatNoInterwiki && !hasTranslatWithInterwiki) {
                displayMessage(
                    "Warning: There are citations in this article that have access dates from before the article was created. This suggests the article may have been copy-pasted from somewhere.",
                    "cTA_warn_date"
                );
                return; // Only show the orange banner and stop further checks
            }

            // If suspicious dates are found and the article is correctly attributed
            if (hasSuspiciousAccessDates && hasTranslatWithInterwiki) {
                displayMessage(
                    "Notice: Despite some citations having access dates before the article's creation, indicating possible copy-pasting or interwiki translation, proper attribution has been given.",
                    "cTA_info_date"
                );
            }
            // If suspicious dates are found and no proper attribution
            else if (hasSuspiciousAccessDates && hasTranslatNoInterwiki) {
                displayMessage(
                    `Warning: This article is likely an unattributed translation. Please see ${wpShortcutLink} for proper attribution, and consider adding ${templateLink} to the talk page.`,
                    "cTA_warn_unattr"
                );
                displayMessage(
                    "Warning: There are citations in this article that have access dates from before the article was created. This suggests the article may have been copy-pasted from somewhere.",
                    "cTA_warn_date"
                );
            }
            // If there are no suspicious dates and the article is correctly attributed
            else if (!hasSuspiciousAccessDates && hasTranslatWithInterwiki) {
                const hasTranslatInTalkPage = await fetchTalkPageContent();
                if (!hasTranslatInTalkPage) {
                    displayMessage(
                        `Notice: This translated article has been correctly attributed. Consider optionally adding ${templateLink} to the talk page.`,
                        "cTA_info_talk"
                    );
                } else {
                    displayMessage(
                        "Notice: This translated article has been correctly attributed.",
                        "cTA_info_talk1"
                    );
                }
            }
            // If there are no suspicious dates and no proper attribution
            else if (!hasSuspiciousAccessDates && hasTranslatNoInterwiki) {
                displayMessage(
                    `Warning: This article is likely an unattributed translation. Please see ${wpShortcutLink} for proper attribution, and consider adding ${templateLink} to the talk page.`,
                    "cTA_warn_unattr"
                );
            }
        } catch (error) {
            console.error("Error checking translation attribution:", error);
        }
    }

    // Run the check
    checkTranslationAttribution();
})();
