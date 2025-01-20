javascript: (function () {
	// Prevent multiple instances
	if (window.PoETradeHelperActive) return;
	window.PoETradeHelperActive = true;

	async function fetchExchangeRates() {
		try {
			const response = await fetch(
				'https://www.pathofexile.com/api/trade2/fetch/e0faea291e5df1a66c50b5f892bd6f7cded78fae0e2669550bc0f8f250dcc0eb,33b75e26c9116b2644429cd1fd9ee71ef81e4b66ada73e9f2c3340464fd57ac3,389ab5bc87203aac01b47cca98ddb96bafee64c4e06af421121c1576df12d376,9602a61fa00f52d054fd36482d6f7bdc914a94e98d23dce91e84fd0299de5892,4e584c05437ffb3fe3e733c7e0ab8177196a80edbea4b698da50599e3748d74b,c1186a01264b7e20c265805223ab531673c26afea2d2de01c19917d5ceea6288,e60621301a486bc64078030ceac24aadb3198c50c748c970b6591abb013bb1dd,6ca9f471c0174fff979ebd87bbd89f7f1382b5e07749c086d414b81f6488d159,a7fc0f6095827a39a3dbe1fd5dbc9f9cb9c204bfca9ebd445f3de0f41bd20aa8,4c1c1203ef416ee1f2596050e9a31a94fdbca88113b2d6b9c3d8f8fa55b8e535?query=&realm=poe2'
			);
			const data = await response.json();
	
			const validRates = data.result
				.filter(item => 
					item && 
					item.listing && 
					item.listing.price && 
					item.listing.price.currency === 'exalted' &&
					item.listing.price.amount >= 100 && // Filter out unrealistic low prices
					item.listing.price.amount <= 150    // Filter out unrealistic high prices
				)
				.map(item => item.listing.price.amount);
	
			console.log("Valid rates:", validRates);
	
			if (validRates.length === 0) {
				throw new Error('No valid exchange rates found');
			}
	
			const averageRate = validRates.reduce((sum, rate) => sum + rate, 0) / validRates.length;
			console.log('Average exchange rate (Divine to Exalted):', averageRate);
	
			return averageRate;
		} catch (error) {
			console.error('Error fetching exchange rates:', error);
			return null;
		}
	}
	//

	// Create main container
	async function createPoEUI() {
		const container = document.createElement('div');
		container.id = 'poe-trade-helper';

		container.setAttribute(
			'style',
			`
            position: fixed;
            top: 50px;
            right: 50px;
            width: 600px;
            min-width: 400px;
            min-height: 300px;
            max-width: 900px;
            max-height: 800px;
            background: linear-gradient(to bottom, #2c2c2c, #1a1a1a);
            border: 2px solid #8b5f2b;
            border-radius: 12px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.7);
            z-index: 10000;
            font-family: 'Fontin Sans', 'Trebuchet MS', Arial, sans-serif;
            color: #d8c8b0;
            overflow: hidden;
            resize: both;
        `
		);

		// Fetch and update the exchange rate
		let exchangeRate;
		try {
			exchangeRate = await fetchExchangeRates();
			console.log('Exchange rate:', exchangeRate);
		} catch (error) {
			console.error('Failed to fetch exchange rates:', error);
			exchangeRate = 100; // Default rate
		}

		async function loadAllPages() {
			return new Promise((resolve) => {
				let pagesLoaded = 0;
				const maxPages = 10;

				function attemptLoadMore() {
					const loadMoreBtn = document.querySelector('.btn.load-more-btn');

					if (!loadMoreBtn || pagesLoaded >= maxPages) {
						resolve(pagesLoaded);
						return;
					}

					loadMoreBtn.click();
					pagesLoaded++;

					// Wait and continue loading
					setTimeout(attemptLoadMore, 1500);
				}

				// Start loading
				attemptLoadMore();
			});

			return container;
		}

		// Search functionality
		function createSearchTab() {
			const searchTab = document.createElement('div');
			searchTab.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label for="includes-input" style="color: #d8c8b0;">Includes (comma-separated):</label>
                        <input 
                            type="text" 
                            id="includes-input" 
                            placeholder="life, critical, maximum" 
                            style="flex-grow: 1; padding: 8px; background: #2a2a2a; border: 1px solid #5a3e1c; color: #d8c8b0; border-radius: 4px;"
                        >
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label for="excludes-input" style="color: #d8c8b0;">Excludes (comma-separated):</label>
                        <input 
                            type="text" 
                            id="excludes-input" 
                            placeholder="chaos, lightning, burning ground.." 
                            style="flex-grow: 1; padding: 8px; background: #2a2a2a; border: 1px solid #8b2b2b; color: #d8c8b0; border-radius: 4px;"
                        >
                    </div>
                    <button id="search-btn" style="background: #5a3e1c; color: #d8c8b0; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; transition: all 0.3s;">
                        Search
                    </button>
                    <div id="search-results" style="background: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 4px; padding: 10px; max-height: 300px; overflow-y: auto; color: #d8c8b0;">
                        Enter search terms to filter items
                    </div>
                </div>
            `;

			// Search logic
			const includesInput = searchTab.querySelector('#includes-input');
			const excludesInput = searchTab.querySelector('#excludes-input');
			const searchButton = searchTab.querySelector('#search-btn');
			const searchResults = searchTab.querySelector('#search-results');

			function normalizeText(text) {
				return text.toLowerCase().replace(/\s+/g, ' ').trim();
			}

			async function performSearch() {
				// Parse includes and excludes
				const includeTerms = includesInput.value
					.split(',')
					.map((term) => normalizeText(term.trim()))
					.filter((term) => term !== '');

				const excludeTerms = excludesInput.value
					.split(',')
					.map((term) => normalizeText(term.trim()))
					.filter((term) => term !== '');

				// If no search terms, reset view
				if (includeTerms.length === 0 && excludeTerms.length === 0) {
					document.querySelectorAll('.row').forEach((row) => {
						row.style.display = '';
					});
					searchResults.innerHTML = 'All items displayed';
					return;
				}

				// Show loading state
				searchResults.innerHTML = `
                    <p>Loading and searching...</p>
                `;

				// Ensure all pages are loaded
				await loadAllPages();

				// Get all rows and filter
				const rows = document.querySelectorAll('.row');
				let matchedCount = 0;

				rows.forEach((row) => {
					// Get the implicit and explicit mods
					const implicitMods = Array.from(row.querySelectorAll('.implicitMod')).map((mod) =>
						normalizeText(mod.textContent)
					);
					const explicitMods = Array.from(row.querySelectorAll('.explicitMod')).map((mod) =>
						normalizeText(mod.textContent)
					);

					// Combine all mods
					const allMods = [...implicitMods, ...explicitMods].join(' ');

					// Check exclude terms first
					const hasExcludeTerm = excludeTerms.some((term) => allMods.includes(term));
					if (hasExcludeTerm) {
						row.style.display = 'none';
						return;
					}

					// Check include terms
					const matchesAllIncludes =
						includeTerms.length === 0 || includeTerms.every((term) => allMods.includes(term));

					if (matchesAllIncludes) {
						row.style.display = '';
						matchedCount++;
					} else {
						row.style.display = 'none';
					}
				});

				// Update search results display
				if (matchedCount === 0) {
					searchResults.innerHTML = `
                        <p>No items found matching the search criteria</p>
                    `;
				} else {
					searchResults.innerHTML = `
                        <p>Found ${matchedCount} items matching the search criteria</p>
                        ${includeTerms.length > 0 ? `<p>Includes: ${includeTerms.join(', ')}</p>` : ''}
                        ${excludeTerms.length > 0 ? `<p>Excludes: ${excludeTerms.join(', ')}</p>` : ''}
                    `;
				}
			}

			// Add event listeners for search
			searchButton.addEventListener('click', performSearch);

			// Allow Enter key to trigger search on any input
			[includesInput, excludesInput].forEach((input) => {
				input.addEventListener('keypress', function (e) {
					if (e.key === 'Enter') {
						performSearch();
					}
				});
			});

			return searchTab;
		}

		function createPriceAnalysisTab() {
			const analysisTab = document.createElement('div');
			analysisTab.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button id="analyze-btn" style="background: #5a3e1c; color: #d8c8b0; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; transition: all 0.3s;">
                        Analyze Prices
                    </button>
                    <div id="analysis-results" style="background: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 4px; padding: 10px; max-height: 300px; overflow-y: auto; color: #d8c8b0;">
                        Click 'Analyze Prices' to start
                    </div>
                </div>
            `;

			const analyzeButton = analysisTab.querySelector('#analyze-btn');
			const analysisResults = analysisTab.querySelector('#analysis-results');

			async function analyzePrices() {
				analysisResults.innerHTML = `<p>Analyzing prices...</p>`;

				// Ensure all pages are loaded
				await loadAllPages();

				// Get all rows
				const rows = document.querySelectorAll('.row');
				const prices = [];
				const currencies = {};

				rows.forEach((row) => {
					const priceElement = row.querySelector('span[data-field="price"]');
					if (priceElement) {
						const priceText = priceElement.textContent.trim();
						const match = priceText.match(/(\d+(\.\d+)?)\s*×?\s*(.+)/);
						if (match) {
							const priceValue = parseFloat(match[1]);
							const currency = match[3].trim();

							if (!isNaN(priceValue)) {
								// Convert all prices to exalts for comparison
								let exaltPrice = priceValue;
								if (currency.toLowerCase().includes('divine')) {
									exaltPrice *= exchangeRate; // 1 divine = 115 exalts
								}
								prices.push({
									value: exaltPrice,
									original: priceValue,
									currency: currency,
								});

								// Count occurrences of each currency
								currencies[currency] = (currencies[currency] || 0) + 1;
							}
						}
					}
				});

				if (prices.length === 0) {
					analysisResults.innerHTML = `<p>No valid prices found.</p>`;
					return;
				}

				// Sort prices for median calculation
				prices.sort((a, b) => a.value - b.value);

				// Calculate median
				const median =
					prices.length % 2 === 0
						? (prices[prices.length / 2 - 1].value + prices[prices.length / 2].value) / 2
						: prices[Math.floor(prices.length / 2)].value;

				// Calculate average
				const average = prices.reduce((sum, price) => sum + price.value, 0) / prices.length;

				// Find min and max
				const min = prices[0].value;
				const max = prices[prices.length - 1].value;

				// Detect potential scams (prices significantly lower than median)
				const potentialScams = prices.filter((price) => price.value < median * 0.5);

				function formatPrice(exalts) {
					const divines = exalts / exchangeRate; // Use the fetched exchange rate
					return `
                        <span style="display: inline-flex; align-items: center; gap: 5px;">
                            <img src="https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQ3VycmVuY3kvQ3VycmVuY3lBZGRNb2RUb1JhcmUiLCJzY2FsZSI6MSwicmVhbG0iOiJwb2UyIn1d/ad7c366789/CurrencyAddModToRare.png" alt="Exalted Orb" style="width: 24px; height: 24px;">
                            ${exalts.toFixed(2)}
                        </span>
                        <span style="margin: 0 5px;">|</span>
                        <span style="display: inline-flex; align-items: center; gap: 5px;">
                            <img src="https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQ3VycmVuY3kvQ3VycmVuY3lNb2RWYWx1ZXMiLCJzY2FsZSI6MSwicmVhbG0iOiJwb2UyIn1d/2986e220b3/CurrencyModValues.png" alt="Divine Orb" style="width: 24px; height: 24px;">
                            ${divines.toFixed(2)}
                        </span>
                    `;
				}

				let resultsHTML = `
                    <p>Total listings: ${prices.length}</p>
                    <p>Median price: ${formatPrice(median)}</p>
                    <p>Average price: ${formatPrice(average)}</p>
                    <p>Minimum price: ${formatPrice(min)}</p>
                    <p>Maximum price: ${formatPrice(max)}</p>
                    <p>Currencies used: ${Object.entries(currencies)
						.map(([currency, count]) => `${currency} (${count})`)
						.join(', ')}</p>
                `;

				if (potentialScams.length > 0) {
					resultsHTML += `
                        <p style="color: #ff6b6b;">Warning: ${
							potentialScams.length
						} potential scam listings detected (prices less than 50% of median):</p>
                        <ul>
                            ${potentialScams.map((scam) => `<li>${scam.original} ${scam.currency}</li>`).join('')}
                        </ul>
                    `;
				}

				analysisResults.innerHTML = resultsHTML;
			}

			analyzeButton.addEventListener('click', analyzePrices);

			return analysisTab;
		}

		// Generate HTML content
		container.innerHTML = `
            <div id="poe-header" style="
            background: linear-gradient(to right, #8b5f2b, #5a3e1c);
            padding: 10px 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            cursor: move;
            ">
            <div style="display: flex; justify-content: space-between; width: 100%;">
            <img src="https://web.poecdn.com/protected/image/trade/layout/logo2.png?key=QoTpbgMmB9GwihOn_t46XQ" 
            style="height: 40px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7)); border-radius: 4px;"
            onerror="this.style.display='none';">
            
            <h2 style="
            margin: 0;
            color: #e6c687;
            text-shadow: 1px 1px 2px black;
            ">Trade Helper</h2>
            
            <div style="display: flex; gap: 10px;">
            <button id="minimize-btn" style="
                background: #5a3e1c;
                color: #d8c8b0;
                border: 1px solid #8b5f2b;
                border-radius: 4px;
                padding: 5px 10px;
                cursor: pointer;
                transition: all 0.3s;
            ">-</button>
            <button id="close-btn" style="
                background: #8b2b2b;
                color: #d8c8b0;
                border: 1px solid #5a1c1c;
                border-radius: 4px;
                padding: 5px 10px;
                cursor: pointer;
                transition: all 0.3s;
            ">✕</button>
            </div>
            </div>
            <div id="exchange-rate-display" style="
            font-size: 14px;
            margin-top: 5px;
            color: #d8c8b0;
            text-align: center;
            ">
            
            <span style="display: inline-flex; align-items: center; gap: 5px;">
            <img src="https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQ3VycmVuY3kvQ3VycmVuY3lNb2RWYWx1ZXMiLCJzY2FsZSI6MSwicmVhbG0iOiJwb2UyIn1d/2986e220b3/CurrencyModValues.png" 
                alt="Divine Orb" 
                style="width: 16px; height: 16px;"
            />
            1 ⇒ ${exchangeRate ? Math.round(exchangeRate) : 'N/A'}
            <img src="https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQ3VycmVuY3kvQ3VycmVuY3lBZGRNb2RUb1JhcmUiLCJzY2FsZSI6MSwicmVhbG0iOiJwb2UyIn1d/ad7c366789/CurrencyAddModToRare.png" 
                alt="Exalted Orb" 
                style="width: 16px; height: 16px;"
            />
            </span>

            <br>
            <small style="color: #d8c8b0;">Current Ratio</small>
            </div>
            </div>

            <div id="tab-navigation" style="
            background: #3a3a3a;
            display: flex;
            justify-content: space-around;
            padding: 10px;
            border-bottom: 2px solid #8b5f2b;
            ">
            <button id="tab1-btn" class="tab-btn active" style="
            background: #5a3e1c;
            color: #d8c8b0;
            border: none;
            padding: 5px 15px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s;
            ">Search</button>
            <button id="tab2-btn" class="tab-btn" style="
            background: #3a3a3a;
            color: #8b5f2b;
            border: 1px solid #5a3e1c;
            padding: 5px 15px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s;
            ">Price Analysis</button>
            </div>

            <div id="tab-content" style="
            padding: 15px;
            min-height: 250px;
            max-height: calc(100% - 140px);
            background: #1a1a1a;
            overflow-y: auto;
            ">
            <div id="tab1-content" class="tab-content-pane"></div>
            <div id="tab2-content" class="tab-content-pane" style="display: none;"></div>
            </div>

            <div id="resize-handle" style="
            position: absolute;
            bottom: 0;
            right: 0;
            width: 15px;
            height: 15px;
            cursor: se-resize;
            background: linear-gradient(45deg, transparent 50%, rgba(139,95,43,0.5) 50%);
            pointer-events: auto;
            "></div>
        `;

		// Add search tab content
		const tab1Content = container.querySelector('#tab1-content');
		tab1Content.appendChild(createSearchTab());

		// Add price analysis tab content
		const tab2Content = container.querySelector('#tab2-content');
		tab2Content.appendChild(createPriceAnalysisTab());

		// Add event listeners and functionality
		setupEventListeners(container);

		return container;
	}

	// Setup event listeners
	function setupEventListeners(container) {
		// Dragging functionality
		let isDragging = false;
		let currentX, currentY, initialX, initialY;
		const dragHandle = container.querySelector('#poe-header');

		function dragStart(e) {
			// Prevent dragging if clicking buttons
			if (e.target.id === 'minimize-btn' || e.target.id === 'close-btn') return;

			initialX = e.clientX - container.offsetLeft;
			initialY = e.clientY - container.offsetTop;
			isDragging = true;
		}

		function drag(e) {
			if (!isDragging) return;
			e.preventDefault();
			currentX = e.clientX - initialX;
			currentY = e.clientY - initialY;
			container.style.left = currentX + 'px';
			container.style.top = currentY + 'px';
		}

		function dragEnd() {
			isDragging = false;
		}

		// Attach drag events
		dragHandle.addEventListener('mousedown', dragStart);
		document.addEventListener('mousemove', drag);
		document.addEventListener('mouseup', dragEnd);

		// Resize functionality
		const resizeHandle = container.querySelector('#resize-handle');
		let isResizing = false;
		let startX, startY, startWidth, startHeight;

		function initResize(e) {
			isResizing = true;

			// Capture starting dimensions and mouse position
			startWidth = container.offsetWidth;
			startHeight = container.offsetHeight;
			startX = e.clientX;
			startY = e.clientY;

			e.preventDefault();
		}

		function resize(e) {
			if (!isResizing) return;

			// Calculate new dimensions
			const width = startWidth + (e.clientX - startX);
			const height = startHeight + (e.clientY - startY);

			// Apply constraints
			const newWidth = Math.min(Math.max(width, 400), 900);
			const newHeight = Math.min(Math.max(height, 300), 800);

			// Set new dimensions
			container.style.width = `${newWidth}px`;
			container.style.height = `${newHeight}px`;
		}

		function stopResize() {
			isResizing = false;
		}

		resizeHandle.addEventListener('mousedown', initResize);
		document.addEventListener('mousemove', resize);
		document.addEventListener('mouseup', stopResize);

		// Tab switching functionality
		const tabButtons = container.querySelectorAll('.tab-btn');
		const tabContents = container.querySelectorAll('.tab-content-pane');

		tabButtons.forEach((btn) => {
			btn.addEventListener('click', () => {
				// Reset all buttons and content
				tabButtons.forEach((b) => {
					b.style.background = '#3a3a3a';
					b.style.color = '#8b5f2b';
					b.style.border = '1px solid #5a3e1c';
				});
				tabContents.forEach((content) => {
					content.style.display = 'none';
				});

				// Activate clicked tab
				btn.style.background = '#5a3e1c';
				btn.style.color = '#d8c8b0';
				btn.style.border = 'none';

				const tabId = btn.id.replace('-btn', '-content');
				container.querySelector(`#${tabId}`).style.display = 'block';
			});
		});

		// Minimize functionality
		const minimizeBtn = container.querySelector('#minimize-btn');
		minimizeBtn.addEventListener('click', () => {
			const tabContent = container.querySelector('#tab-content');
			const tabNavigation = container.querySelector('#tab-navigation');

			if (tabContent.style.display !== 'none') {
				tabContent.style.display = 'none';
				tabNavigation.style.display = 'none';
				minimizeBtn.textContent = '+';
			} else {
				tabContent.style.display = 'block';
				tabNavigation.style.display = 'flex';
				minimizeBtn.textContent = '-';
			}
		});

		// Close functionality
		const closeBtn = container.querySelector('#close-btn');
		closeBtn.addEventListener('click', () => {
			document.body.removeChild(container);
			window.PoETradeHelperActive = false;
		});
	}

	// Initialize and add to document
	async function init() {
		const ui = await createPoEUI();
		document.body.appendChild(ui);
	}

	// Run initialization
	init();
})();
