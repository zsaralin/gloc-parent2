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
    const scaleFactor = .05; // Define your base scale factor
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
    
            // **Step 1: Move current image to `prevImg` before applying fade**
            prevImg.style.backgroundImage = currImg.style.backgroundImage;
            prevImg.style.opacity = 1;
            currImg.style.opacity = 0;
    
            // **Step 2: Fade out text smoothly**
            topText.style.transition = `opacity ${TEXT_FADE_DURATION}s ease-in-out`;
            bottomText.style.transition = `opacity ${TEXT_FADE_DURATION}s ease-in-out`;
            topText.style.opacity = 0;
            bottomText.style.opacity = 0;
    
            // **Step 3: Wait a small delay before setting the new image**
            await new Promise(resolve => setTimeout(resolve, 50));
    
            // **Step 4: Update the new image on `currImg`**
            currImg.style.backgroundImage = `url('${imageElement.src}')`;
    
            // **Step 5: Fade in the new image**
            currImg.style.transition = `opacity ${CROSSFADE_DURATION}s ease-in-out`;
            currImg.style.opacity = 1;
    
            // **Step 6: Wait for the image fade-in to complete**
            await new Promise(resolve => setTimeout(resolve, CROSSFADE_DURATION * 1000));
    
            // **Step 7: Now update and fade in the text**
            if (!shuffle) {
                updateTextContent(topText, bottomText, imageElement, index, scaledSimilarity);
            }
    
            // **Ensure text fades in after the image fade**
            setTimeout(() => {
                topText.style.opacity = 1;
                bottomText.style.opacity = 1;
            }, 100); // Small delay to ensure smooth transition
    
            // **Step 8: Ensure prevImg fades out after completion**
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
            .filter(({ image }) => !!image) // Ensure there are corresponding images
            .sort(() => Math.random() - 0.5); // Shuffle the items

        // Process items with staggered updates using requestAnimationFrame
        const processBatch = (startIndex) => {
            if (startIndex >= shuffledItems.length) return; // Stop if all items are processed
            const batch = shuffledItems.slice(startIndex, startIndex + 5); // Process in batches of 3
            batch.forEach(({ item, image, originalIndex }) => {
                updateGridItem(item, image, originalIndex, true);
            });

            // Use requestAnimationFrame for staggered timing
            requestAnimationFrame(() => {
                setTimeout(() => processBatch(startIndex + 5), 200); // Delay next batch by 200ms
            });


        };
    
        // Start processing the first batch
        processBatch(0);

    } else {
        
        // Update all grid items in a single loop
        allGridItems.forEach((item, index) => {
            if (index < images.length) {
                const imageElement = images[index];
                updateGridItem(item, imageElement, index, useCrossFade);
            }
        });
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
