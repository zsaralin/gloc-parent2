import { getLanguage, getText } from "../config";
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
    const updateGridItem = (item, imageElement, index, useCrossFade) => {
        const currImg = item.querySelector('.curr-img');
        const prevImg = item.querySelector('.prev-img');
        const topText = item.querySelector('.top-text'); // Text for distance
        const bottomText = item.querySelector('.bottom-text'); // Text for label
        const vertFill = item.querySelector('.vert-bar-fill'); // Text for label

        if (!currImg || !prevImg || !topText || !bottomText) return;
    
        let scaledSimilarity = ''; // Declare in broader scope
        item.setAttribute('data-info', JSON.stringify(imageElement)); // Store object as JSON string
        
        if (!shuffle) {
            // Calculate normalized distance
            let dynamicScaleFactor = scaleFactor * (1 - index / (numArrangedImages * 2));
            scaledSimilarity = imageElement.distance  !== 0 ? (imageElement.distance * dynamicScaleFactor).toFixed(2) : 0
        }

        if (useCrossFade) {
            currImg.setAttribute('data-label', imageElement.label);
            prevImg.style.backgroundImage = `url('${imageElement.src}')`;
            currImg.style.transition = `opacity ${CROSSFADE_DURATION}s ease-in-out`;
            topText.style.transition = `opacity ${TEXT_FADE_DURATION}s ease-in-out`; // Add transition for top text
            bottomText.style.transition = `opacity ${TEXT_FADE_DURATION}s ease-in-out`; // Add transition for bottom text        

            // Compute new bottom text
            
            // let truncatedName = 
            // index === 0 ?
            // truncateNameToFit(
            //     imageElement.jsonData.nombre,
            //     bottomText,
            //     3,
            //     ` [No. Records: ${imageElement.jsonData.numeroDeRegistros}]`
            // ) : 
            // truncateNameToFit(
            //     imageElement.jsonData.nombre,
            //     bottomText,
            //     3,
            //     ` [${imageElement.jsonData.numeroDeRegistros}]`
            // );
            // const newBottomText =  `${truncatedName} [${imageElement.jsonData.numeroDeRegistros}]`
            // const isBottomTextSame = bottomText.innerHTML === newBottomText || bottomText.innerHTML === '';
            
            topText.style.opacity = 0;
            // if (!isBottomTextSame) {
                bottomText.style.opacity = 0;
            // }
            currImg.style.opacity = 0;    
        
            
            // ✅ Fade out elements selectively

        
            setTimeout(() => {
                currImg.style.backgroundImage = `url('${imageElement.src}')`;
                currImg.style.transition = 'opacity 0s linear';
                currImg.style.opacity = 1;
        
                // Update text content
                if (!shuffle) {
                    updateTextContent(topText, bottomText, imageElement, index, scaledSimilarity);
                }
        
                // ✅ Fade back in selectively
                setTimeout(() => {
                    topText.style.opacity = 1;
                    bottomText.style.opacity = 1;
                }, TEXT_FADE_DELAY / 10); // Delay slightly to sync with the image fade
            }, TEXT_FADE_DELAY); // Delay matches the crossfade duration
        }
        
        else {
            prevImg.style.backgroundImage = currImg.style.backgroundImage;
            currImg.style.backgroundImage = `url('${imageElement.src}')`;
    
            // Update text immediately for non-crossfade if shuffle is not active
            if (!shuffle) {
                updateTextContent(topText, bottomText, imageElement, index, scaledSimilarity);
            }
        }
        vertFill.style.height = scaledSimilarity*10 + '%'; // Add transition for bottom text

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
    const { title_short } = getText();
    const currLanguage = getLanguage();
    const data = imageElement.jsonData;
  
    const name = currLanguage === 'es' ? data.nombre : data.name;
    const numRecords = currLanguage === 'es' ? data.numeroDeRegistros : data.numberOfRecords;
  
    const recordSuffix = index === 0 ? ` [No. Records: ${numRecords}]` : ` [${numRecords}]`;
  
    const truncatedName = truncateNameToFit(name, bottomText, 3, recordSuffix);
    bottomText.innerHTML = `${truncatedName}${recordSuffix}`;
  
    topText.textContent = index === 0
      ? `${title_short}: ${scaledSimilarity}%`
      : `${scaledSimilarity}%`;
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
