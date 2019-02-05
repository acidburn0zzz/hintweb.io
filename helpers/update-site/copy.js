const fs = require('fs');

const shell = require('shelljs');
const mkdirp = require('mkdirp');

const constans = require('./constants');
const { safeWriteFile, setShellJSDefaultConfig } = require('./common');

const FORMATTER_SRC = `${constans.dirs.HINT_PACKAGES}/formatter-html/src`;

setShellJSDefaultConfig(shell);

const hintDocumentationPaths = new Set([
    {
        dest: constans.dirs.CONTRIBUTOR_GUIDE,
        options: '-R',
        orig: `${constans.dirs.HINT_PACKAGES}/hint/docs/contributor-guide`
    },
    {
        dest: constans.dirs.USER_GUIDE,
        options: '-R',
        orig: `${constans.dirs.HINT_PACKAGES}/hint/docs/user-guide`
    },
    {
        dest: constans.dirs.CONTENT,
        options: '-R',
        orig: `${constans.dirs.HINT_PACKAGES}/hint/docs/about`
    },
    {
        dest: constans.dirs.ABOUT,
        options: null,
        orig: `${constans.dirs.HINT_PACKAGES}/hint/CHANGELOG.md`
    }
]);

const htmlFormatterPaths = new Set([
    {
        dest: constans.dirs.SCAN_TEMPLATES,
        options: '-R',
        orig: `${FORMATTER_SRC}/views/partials`
    }, {
        dest: constans.dirs.SCAN_IMAGES,
        options: '-R',
        orig: `${FORMATTER_SRC}/assets/images/scan`
    }, {
        dest: constans.dirs.SCAN_STYLES,
        options: '-R',
        orig: `${FORMATTER_SRC}/assets/styles/scan`
    }, {
        dest: constans.dirs.SCAN_SCRIPTS,
        options: '-R',
        orig: `${FORMATTER_SRC}/assets/js/scan`
    }, {
        // This file will be compiled during the building process.
        dest: `${constans.dirs.SCAN_PARTIALS}/utils.ts`,
        options: null,
        orig: `${FORMATTER_SRC}/utils.ts`
    }
]);

/**
 * Copy the origin directory or file in the destination path.
 * @param {string} orig - Origin directory or file.
 * @param {string} dest - Destinatino path.
 * @param {string} options - Options.
 */
const copy = (orig, dest, options) => {
    if (options) {
        shell.cp(options, orig, dest);

        return;
    }

    shell.cp(orig, dest);
};

/**
 * Copy hint documentation from the hint repository
 * to the content directory.
 */
const copyHintDocumentation = () => {
    hintDocumentationPaths.forEach((path) => {
        copy(path.orig, path.dest, path.options);
    });
};

/**
 * Copy the resource images into the user guide folder for that type of resource.
 * @param {string} resource - Type of resource (hint, formatter, conector, etc.)
 */
const copyResourceImages = (resource) => {
    const destDirectory = `${constans.dirs.USER_GUIDE}/${resource}s/images`;

    mkdirp.sync(destDirectory);

    copy(`${constans.dirs.HINT_PACKAGES}/${resource}-*/images`, destDirectory, '-R');
};

/**
 * Copy the formatter HTML formatter files from the hint respository
 * to their directory.
 */
const copyHTMLFormatter = () => {
    mkdirp.sync(constans.dirs.SCAN_PARTIALS);
    htmlFormatterPaths.forEach((path) => {
        copy(path.orig, path.dest, path.options);
    });

    /*
     * We need to pre-process the styles from the HTML Formatter
     * just in case the formatter has the image urls relative. The
     * website needs absolute image urls.
     *
     * background-image: url('./images/scan/sub-section.svg') => background-image: url('/images/scan/sub-section.svg').
     */
    const cssPath = `${constans.dirs.SCAN_STYLES}/scan-results.css`;
    const cssContent = fs.readFileSync(cssPath, 'utf-8'); // eslint-disable-line no-sync
    const newCSSContent = cssContent.replace(/url\("([^"]*)"\)/gi, (matchString, matchGroup) => {
        const newContent = matchGroup.substr(matchGroup.indexOf('/images'));

        return matchString.replace(matchGroup, newContent);
    });

    safeWriteFile(cssPath, newCSSContent);
};

module.exports = {
    copy,
    copyHTMLFormatter,
    copyHintDocumentation,
    copyResourceImages
};
