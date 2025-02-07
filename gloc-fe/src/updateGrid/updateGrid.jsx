import { stopShuffle } from "./shuffleManagerService";

const CROSSFADE_DURATION = 2; // In seconds
const TEXT_FADE_DURATION = CROSSFADE_DURATION/2; // In seconds
const TEXT_FADE_DELAY = CROSSFADE_DURATION * 1000; // Convert seconds to milliseconds
export async function fillGridItems(images, useCrossFade = false, stagger = false, shuffle = false) {
    // Ensure images are available
    if (!images || images.length === 0) {
        console.error('No images available to fill the grid items.');
        return;
    }

    const topGridItems = document.querySelectorAll('.top-row-item .image-container');
    const bottomGridItems = document.querySelectorAll('.bottom-grid-item .image-container');
    const allGridItems = [...topGridItems, ...bottomGridItems];

    if (allGridItems.length === 0) {
        console.error('No grid elements with the specified classes found in the DOM.');
        return;
    }

    const numArrangedImages = allGridItems.length;
    const scaleFactor = 0.05;

    const updateGridItem = async (item, imageElement, index, useCrossFade) => {
        const currImg = item.querySelector('.curr-img');
        const prevImg = item.querySelector('.prev-img');
        const topText = item.querySelector('.top-text');
        const bottomText = item.querySelector('.bottom-text');
        const vertFill = item.querySelector('.vert-bar-fill');

        if (!currImg || !prevImg || !topText || !bottomText) return;

        // Prevent instant updates if the same image is already set
        const prevLabel = currImg.getAttribute('data-label');
        if (prevLabel === imageElement.label) return;

        let scaledSimilarity = '';
        item.setAttribute('data-info', JSON.stringify(imageElement));

        if (!shuffle) {
            let dynamicScaleFactor = scaleFactor * (1 - index / (numArrangedImages * 2));
            scaledSimilarity = (imageElement.distance * dynamicScaleFactor).toFixed(2);
        }

        if (useCrossFade) {
            currImg.setAttribute('data-label', imageElement.label);

            // Move current image to `prevImg` before fading
            prevImg.style.backgroundImage = currImg.style.backgroundImage;
            prevImg.style.opacity = 1;
            currImg.style.opacity = 0;

            // Fade out text
            topText.style.transition = `opacity ${TEXT_FADE_DURATION}s ease-in-out`;
            bottomText.style.transition = `opacity ${TEXT_FADE_DURATION}s ease-in-out`;
            topText.style.opacity = 0;
            bottomText.style.opacity = 0;

            // Short delay before setting the new image
            await new Promise(resolve => setTimeout(resolve, 50));

            // Set new image
            currImg.style.backgroundImage = `url('${imageElement.src}')`;

            // Fade in the new image
            currImg.style.transition = `opacity ${CROSSFADE_DURATION}s ease-in-out`;
            currImg.style.opacity = 1;

            // Wait for the fade-in effect to complete
            await new Promise(resolve => setTimeout(resolve, CROSSFADE_DURATION * 1000));

            // Update and fade in text after image fade completes
            if (!shuffle) {
                updateTextContent(topText, bottomText, imageElement, index, scaledSimilarity);
            }

            await new Promise(resolve => setTimeout(resolve, 100));
            topText.style.opacity = 1;
            bottomText.style.opacity = 1;

            // Ensure prevImg fades out after completion
            prevImg.style.opacity = 0;
        } else {
            prevImg.style.backgroundImage = currImg.style.backgroundImage;
            currImg.style.backgroundImage = `url('${imageElement.src}')`;

            if (!shuffle) {
                updateTextContent(topText, bottomText, imageElement, index, scaledSimilarity);
            }

            // Fade in text immediately if no crossfade
            topText.style.opacity = 1;
            bottomText.style.opacity = 1;
        }

        vertFill.style.height = scaledSimilarity * 10 + '%';
    };

    if (stagger) {     
        // Shuffle items for randomness
        const shuffledItems = allGridItems
            .map((item, index) => ({ item, image: images[index], originalIndex: index }))
            .filter(({ image }) => !!image)
            .sort(() => Math.random() - 0.5);

        // **Async function to process staggered batches**
        async function processBatch(startIndex) {
            if (startIndex >= shuffledItems.length) return;

            const batch = shuffledItems.slice(startIndex, startIndex + 5);
            await Promise.all(batch.map(({ item, image, originalIndex }) => updateGridItem(item, image, originalIndex, true)));

            return new Promise(resolve => {
                requestAnimationFrame(() => setTimeout(() => {
                    processBatch(startIndex + 5).then(resolve);
                }, 200));
            });
        }

        return processBatch(0);
    } else {
        await Promise.all(
            allGridItems.map(async (item, index) => {
                if (index < images.length) {
                    await updateGridItem(item, images[index], index, useCrossFade);
                }
            })
        );
    }
}

function updateTextContent(topText, bottomText, imageElement, index, scaledSimilarity) {
    if (index === 0) {
        topText.textContent = `Level of Confidence: ${scaledSimilarity}%`;

        // Truncate the name only
        const truncatedName = truncateNameToFit(
            imageElement.jsonData.nombre,
            bottomText,
            3,
            ` [No. Records: ${imageElement.jsonData.numeroDeRegistros}]`
        );
        bottomText.innerHTML = `${truncatedName} [No. Records: ${imageElement.jsonData.numeroDeRegistros}]`;
    } else {
        topText.textContent = `${scaledSimilarity}%`;

        const truncatedName = truncateNameToFit(
            imageElement.jsonData.nombre,
            bottomText,
            3,
            ` [${imageElement.jsonData.numeroDeRegistros}]`
        );
        bottomText.innerHTML = `${truncatedName} [${imageElement.jsonData.numeroDeRegistros}]`;
    }
}

export function setupOverlayTransparency() {
    const topGridItems = document.querySelectorAll('.top-row-item .image-container');
    const bottomGridItems = document.querySelectorAll('.bottom-grid-item .image-container');

    if (topGridItems.length === 0 && bottomGridItems.length === 0) {
        console.error('No grid elements with the specified classes found in the DOM.');
        return;
    }

    const totalGridItems = topGridItems.length + bottomGridItems.length;
    const allGridItems = [...topGridItems, ...bottomGridItems];

    allGridItems.forEach((item, index) => {
        const overlay = item.querySelector('.overlay');
        if (!overlay) return;

        // Adjust overlay transparency
        const transparency = 1 - calculateOpacity(index, totalGridItems); // Invert opacity for transparency
        overlay.style.backgroundColor = `rgba(0, 0, 0, ${transparency})`;
    });
}


// Helper function to calculate opacity
function calculateOpacity(index, totalItems) {
    const minOpacity = 0.3; // Minimum opacity for the last item (10% transparency)
    const maxOpacity = 1.0; // Maximum opacity for the first item (fully opaque)
    return maxOpacity - (index / (totalItems - 1)) * (maxOpacity - minOpacity);
}

function truncateNameToFit(name, element, maxLines, appendedText) {
    const computedStyle = window.getComputedStyle(element);
    const lineHeight = parseFloat(computedStyle.lineHeight);
    const maxHeight = lineHeight * maxLines;

    // Combine name with the appended text for testing height
    element.textContent = `${name}${appendedText}`;

    // Check if the combined content fits within the max height
    if (element.scrollHeight <= maxHeight) {
        return name; // No truncation needed
    }

    // Truncate only the name while ensuring appendedText remains
    let truncatedName = name;
    while (element.scrollHeight > maxHeight && truncatedName.length > 0) {
        truncatedName = truncatedName.slice(0, -1).trim(); // Remove trailing space if any
        element.textContent = `${truncatedName}...${appendedText}`;
    }

    return `${truncatedName}...`; // Return the truncated name with ellipsis
}
