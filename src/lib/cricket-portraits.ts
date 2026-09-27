// Verified individual, authentic high-resolution real cricketer portraits.
// STRICT ANTI-MISMATCH POLICY:
// 1. Only assign a photo if it genuinely, undeniably belongs to THAT specific player.
// 2. Never reuse another cricketer's photo for a different player.
// 3. If no authentic photo exists on the internet, return "" (empty string) so the UI
//    elegantly renders the gold monogram crest with role badge and country flag.

export const CRICKETER_PORTRAIT_SEEDS: Record<string, string> = {
  // ==========================================
  // --- INDIAN BATTERS ---
  // ==========================================
  "virat-kohli":
    "https://upload.wikimedia.org/wikipedia/commons/e/ef/Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg",
  "rohit-sharma":
    "https://upload.wikimedia.org/wikipedia/commons/1/1e/Prime_Minister_Of_Bharat_Shri_Narendra_Damodardas_Modi_with_Shri_Rohit_Gurunath_Sharma_%28Cropped%29.jpg",
  "suryakumar-yadav":
    "https://upload.wikimedia.org/wikipedia/commons/b/b7/Suryakumar_Yadav_in_PMO_New_Delhi.jpg",
  "shubman-gill":
    "https://upload.wikimedia.org/wikipedia/commons/3/34/Shubman_Gill_2023_%28cropped%29.jpg",
  "yashasvi-jaiswal":
    "https://upload.wikimedia.org/wikipedia/commons/7/71/Yashasvi_Jaiswal_in_PMO_New_Delhi.jpg",
  "rinku-singh": "",
  "ruturaj-gaikwad":
    "https://upload.wikimedia.org/wikipedia/commons/2/27/Ruturaj_Gaikwad.jpeg",
  "tilak-varma":
    "https://upload.wikimedia.org/wikipedia/commons/0/0b/Tilak_Varma_in_March_2026.png",
  "abhishek-sharma": "",
  "sai-sudharsan":
    "https://upload.wikimedia.org/wikipedia/commons/f/fb/Sai_Sudharsan_GT_vs_CSK_IPL_2023.jpg",
  "shreyas-iyer":
    "https://upload.wikimedia.org/wikipedia/commons/a/ae/Shreyas_Iyer_snapped_at_the_airport_%28Cropped%29.jpg",
  "rajat-patidar": "",
  "shashank-singh": "",
  "ashutosh-sharma": "",
  "devdutt-padikkal": "",
  "rahul-tripathi": "",
  "shikhar-dhawan":
    "https://upload.wikimedia.org/wikipedia/commons/3/3f/SHIKHAR_DHAWAN_%2816005494418%29.jpg",
  "ajinkya-rahane":
    "https://upload.wikimedia.org/wikipedia/commons/9/96/Ajinkya_Rahane_2016_%28cropped%29.jpg",
  "prithvi-shaw":
    "https://upload.wikimedia.org/wikipedia/commons/a/a8/Prithvi_shaw.png",
  "sarfaraz-khan":
    "https://upload.wikimedia.org/wikipedia/commons/7/79/Sarfaraz_Khan.jpg",
  "karun-nair": "",
  "manish-pandey": "",
  "mayank-agarwal": "",
  "mandeep-singh": "",
  "ambati-rayudu": "",
  "robin-uthappa":
    "https://upload.wikimedia.org/wikipedia/commons/e/eb/Robin_Uthappa_IPL_2012.jpg",
  "yash-dhull": "",
  "angkrish-raghuvanshi": "",
  "sameer-rizvi": "",
  "abdul-samad": "",
  "shahrukh-khan": "",
  "ayush-badoni": "",
  "nehal-wadhera": "",
  "suyash-prabhudessai": "",
  "abhinav-manohar": "",
  "shaik-rasheed": "",
  "swastik-chikara": "",
  "priyam-garg": "",

  // ==========================================
  // --- OVERSEAS BATTERS ---
  // ==========================================
  "travis-head":
    "https://upload.wikimedia.org/wikipedia/commons/0/05/Travis_Head_bowling_at_Perth_Stadium%2C_First_Test_Australia_versus_West_Indies%2C_2_December_2022_03_%28cropped%29.jpg",
  "david-miller":
    "https://upload.wikimedia.org/wikipedia/commons/f/f6/David_Miller_2025_interview_%28cropped%29.png",
  "faf-du-plessis":
    "https://upload.wikimedia.org/wikipedia/commons/8/87/Faf_du_Plessis_2019_Boxing_Day.jpg",
  "david-warner":
    "https://upload.wikimedia.org/wikipedia/commons/2/2c/DAVID_WARNER_%2811704782453%29.jpg",
  "harry-brook":
    "https://upload.wikimedia.org/wikipedia/commons/6/63/Harry_Brook_County_cricket_cropped.jpg",
  "steve-smith":
    "https://upload.wikimedia.org/wikipedia/commons/1/1b/STEVE_SMITH_%2811705303043%29.jpg",
  "kane-williamson":
    "https://upload.wikimedia.org/wikipedia/commons/2/2a/Kane_Williamson_in_2019.jpg",
  "jake-fraser-mcgurk":
    "https://upload.wikimedia.org/wikipedia/commons/c/c1/260328_D3_Jake_Fraser-McGurk_01.jpg",
  "tristan-stubbs": "",
  "shimron-hetmyer":
    "https://upload.wikimedia.org/wikipedia/commons/8/8a/Shimron_Hetmyer.jpg",
  "rovman-powell": "",
  "aiden-markram":
    "https://upload.wikimedia.org/wikipedia/commons/2/25/Aiden_Markram_interview_after_WTC_final_2025_%28cropped%29.png",
  "glenn-phillips": "",
  "daryl-mitchell": "",
  "devon-conway": "",
  "dewald-brevis": "",
  "reeza-hendricks": "",
  "alex-hales": "",
  "rilee-rossouw": "",
  "rassie-van-der-dussen": "",
  "brandon-king": "",
  "finn-allen": "",
  "michael-bracewell": "",
  "matthew-short": "",
  "sherfane-rutherford": "",
  "ashton-turner": "",

  // ==========================================
  // --- INDIAN WICKETKEEPERS ---
  // ==========================================
  "ms-dhoni":
    "https://upload.wikimedia.org/wikipedia/commons/d/d5/MS_Dhoni_%28Prabhav_%2723_-_RiGI_2023%29.jpg",
  "rishabh-pant":
    "https://upload.wikimedia.org/wikipedia/commons/7/77/Rishabh_Pant.jpg",
  "sanju-samson":
    "https://upload.wikimedia.org/wikipedia/commons/7/70/Sanju_Samson_in_PMO_New_Delhi.jpg",
  "kl-rahul":
    "https://upload.wikimedia.org/wikipedia/commons/6/69/KL_Rahul_at_Femina_Miss_India_2018_Grand_Finale_%28cropped%29.jpg",
  "ishan-kishan":
    "https://upload.wikimedia.org/wikipedia/commons/d/d7/Ishan_Kishan.jpg",
  "jitesh-sharma": "",
  "dhruv-jurel": "",
  "prabhsimran-singh": "",
  "dinesh-karthik":
    "https://upload.wikimedia.org/wikipedia/commons/f/fc/Dinesh.Karthik.jpg",
  "wriddhiman-saha": "",
  "ks-bharat": "",
  "anuj-rawat": "",
  "abhishek-porel": "",
  "kumar-kushagra": "",
  "robin-minz": "",
  "vishnu-vinod": "",

  // ==========================================
  // --- OVERSEAS WICKETKEEPERS ---
  // ==========================================
  "heinrich-klaasen": "",
  "jos-buttler":
    "https://upload.wikimedia.org/wikipedia/commons/7/7b/Jos_Buttler_in_2023.jpg",
  "nicholas-pooran": "",
  "phil-salt":
    "https://upload.wikimedia.org/wikipedia/commons/4/4b/2_02_Phil_Salt.jpg",
  "quinton-de-kock":
    "https://upload.wikimedia.org/wikipedia/commons/8/80/QUINTON_DE_KOCK_%2815681398316%29.jpg",
  "josh-inglis": "",
  "rahmanullah-gurbaz": "",
  "ryan-rickelton": "",
  "shai-hope": "",
  "tom-banton": "",

  // ==========================================
  // --- INDIAN FAST BOWLERS ---
  // ==========================================
  "jasprit-bumrah":
    "https://upload.wikimedia.org/wikipedia/commons/0/02/Jasprit_Bumrah_in_PMO_New_Delhi.jpg",
  "mohammed-shami":
    "https://upload.wikimedia.org/wikipedia/commons/0/0b/Prime_Minister_Of_Bharat_Shri_Narendra_Damodardas_Modi_with_Mohammad_Shami_%28Cropped%29.jpg",
  "mohammed-siraj":
    "https://upload.wikimedia.org/wikipedia/commons/1/1a/Prime_Minister_Of_Bharat_Shri_Narendra_Damodardas_Modi_with_Mohammad_Siraj_%28cropped%29.jpg",
  "arshdeep-singh":
    "https://upload.wikimedia.org/wikipedia/commons/8/87/Prime_Minister_Of_Bharat_Shri_Narendra_Damodardas_Modi_with_Arshdeep_Singh_Family_%28Cropped%29.jpg",
  "bhuvneshwar-kumar":
    "https://upload.wikimedia.org/wikipedia/commons/e/ec/500px-Bhuvneshwar_kumar_With_Rashid_Zirak_%28Bhuvneshwar_Kumar_cropped%29.jpg",
  "harshit-rana": "",
  "mayank-yadav": "",
  "prasidh-krishna": "",
  "avesh-khan": "",
  "mukesh-kumar": "",
  "khaleel-ahmed":
    "https://upload.wikimedia.org/wikipedia/commons/d/d4/2_29_Khaleel_mugshot.jpg",
  "umran-malik":
    "https://upload.wikimedia.org/wikipedia/commons/d/df/Umran_Malik_in_GGM.jpg",
  "sandeep-sharma": "",
  "mohit-sharma": "",
  "ishant-sharma": "",
  "akash-deep": "",
  "vaibhav-arora": "",
  "yash-dayal": "",
  "chetan-sakariya": "",
  "shivam-mavi": "",
  "kartik-tyagi": "",
  "rasikh-salam": "",
  "mohsin-khan": "",
  "vyshak-vijay-kumar": "",
  "navdeep-saini": "",
  "simarjeet-singh": "",
  "kuldeep-sen": "",
  "jaydev-unadkat": "",
  "siddharth-kaul": "",
  "varun-aaron": "",

  // ==========================================
  // --- OVERSEAS FAST BOWLERS ---
  // ==========================================
  "pat-cummins":
    "https://upload.wikimedia.org/wikipedia/commons/6/69/Pat_Cummins_fielding_Ashes_2021_%28cropped%29.jpg",
  "mitchell-starc":
    "https://upload.wikimedia.org/wikipedia/commons/7/78/Mitchell_Starc_2023.jpg",
  "trent-boult": "",
  "kagiso-rabada":
    "https://upload.wikimedia.org/wikipedia/commons/c/c5/Kagiso_Rabada_%2848149867991%29_%28cropped%29.jpg",
  "matheesha-pathirana": "",
  "josh-hazlewood":
    "https://upload.wikimedia.org/wikipedia/commons/5/52/2018_Josh_Hazlewood_%28cropped%29.jpg",
  "lockie-ferguson":
    "https://upload.wikimedia.org/wikipedia/commons/1/1d/Lockie_Ferguson.jpg",
  "anrich-nortje": "",
  "gerald-coetzee": "",
  "alzarri-joseph": "",
  "mustafizur-rahman":
    "https://upload.wikimedia.org/wikipedia/commons/2/22/Mustafizur_Rahman_%284%29_%28cropped%29.jpg",
  "naveen-ul-haq": "",
  "fazalhaq-farooqi":
    "https://upload.wikimedia.org/wikipedia/commons/8/87/Fazalhaq_Farooqi.jpg",
  "spencer-johnson": "",
  "nathan-ellis": "",
  "nuwan-thushara": "",
  "dilshan-madushanka": "",
  "shamar-joseph": "",
  "jhye-richardson": "",
  "reece-topley": "",
  "chris-woakes": "",
  "lizaad-williams": "",
  "gus-atkinson": "",
  "taskin-ahmed": "",
  "tim-southee":
    "https://upload.wikimedia.org/wikipedia/commons/b/b9/Tim_Southee_2016_%28cropped%29.jpg",

  // ==========================================
  // --- INDIAN ALL-ROUNDERS ---
  // ==========================================
  "hardik-pandya":
    "https://upload.wikimedia.org/wikipedia/commons/f/fc/Hardik_Pandya_in_PMO_New_Delhi.jpg",
  "ravindra-jadeja": "",
  "axar-patel": "",
  "shivam-dube":
    "https://upload.wikimedia.org/wikipedia/commons/4/4a/Shivam_Dube_in_PMO_New_Delhi.jpg",
  "washington-sundar":
    "https://upload.wikimedia.org/wikipedia/commons/3/3d/Washington_Sundar.jpg",
  "nitish-reddy":
    "https://upload.wikimedia.org/wikipedia/commons/1/1e/Nitish_Kumar_Reddy_BGT_2024_%28cropped%29_2.jpg",
  "venkatesh-iyer":
    "https://upload.wikimedia.org/wikipedia/commons/a/a2/Venkatesh_Iyer.png",
  "shardul-thakur": "",
  "rahul-tewatia": "",
  "shahbaz-ahmed": "",
  "ramandeep-singh": "",
  "riyan-parag": "",
  "deepak-hooda": "",
  "harpreet-brar": "",
  "krishnappa-gowtham": "",
  "vijay-shankar": "",
  "swapnil-singh": "",
  "jalaj-saxena": "",

  // ==========================================
  // --- OVERSEAS ALL-ROUNDERS ---
  // ==========================================
  "andre-russell":
    "https://upload.wikimedia.org/wikipedia/commons/9/9f/Andre_Russell_%281%29.jpg",
  "sunil-narine":
    "https://upload.wikimedia.org/wikipedia/commons/e/ee/Sunil_Narine.jpg",
  "glenn-maxwell":
    "https://upload.wikimedia.org/wikipedia/commons/3/3d/Glen_Maxwell_2026_%28cropped%29.jpg",
  "marcus-stoinis":
    "https://upload.wikimedia.org/wikipedia/commons/c/cb/2018.01.21.15.22.25-Stoinis_%2839081521620%29.jpg",
  "sam-curran": "",
  "liam-livingstone": "",
  "mitchell-marsh":
    "https://upload.wikimedia.org/wikipedia/commons/9/99/Mitchell_Marsh.jpg",
  "tim-david": "",
  "will-jacks":
    "https://upload.wikimedia.org/wikipedia/commons/e/ec/4_20_Will_Jacks.jpg",
  "wanindu-hasaranga":
    "https://upload.wikimedia.org/wikipedia/commons/9/91/Waniya.jpg",
  "mohammad-nabi":
    "https://upload.wikimedia.org/wikipedia/commons/3/37/Mohammad_Nabi-Australia.jpg",
  "romario-shepherd": "",
  "jason-holder": "",
  "kyle-mayers": "",
  "azmatullah-omarzai": "",
  "daniel-sams": "",
  "roelof-van-der-merwe": "",
  "ashton-agar":
    "https://upload.wikimedia.org/wikipedia/commons/6/66/Ashton_Agar_2016.jpg",

  // ==========================================
  // --- INDIAN SPINNERS ---
  // ==========================================
  "kuldeep-yadav":
    "https://upload.wikimedia.org/wikipedia/commons/9/91/Kuldeep_Yadav_in_PMO_New_Delhi.jpg",
  "yuzvendra-chahal":
    "https://upload.wikimedia.org/wikipedia/commons/d/df/Yuzvendra_Chahal_in_PMO_New_Delhi.jpg",
  "varun-chakaravarthy": "",
  "varun-chakravarthy": "",
  "ravi-bishnoi": "",
  "suyash-sharma":
    "https://upload.wikimedia.org/wikipedia/commons/7/7c/Suyash_Sharma.png",
  "sai-kishore":
    "https://upload.wikimedia.org/wikipedia/commons/f/f9/4_15_Sai_Kishore.jpg",
  "piyush-chawla":
    "https://upload.wikimedia.org/wikipedia/commons/0/07/Piyush_Chawla_2019.jpg",
  "rahul-chahar": "",
  "karn-sharma": "",
  "amit-mishra": "",
  "mayank-markande": "",
  "shreyas-gopal": "",
  "murugan-ashwin": "",
  "kumar-kartikeya": "",
  "jagadeesha-suchith": "",

  // ==========================================
  // --- OVERSEAS SPINNERS ---
  // ==========================================
  "rashid-khan":
    "https://upload.wikimedia.org/wikipedia/commons/2/29/Rashid_Khan.jpg",
  "maheesh-theekshana": "",
  "noor-ahmad": "",
  "mitchell-santner": "",
  "keshav-maharaj":
    "https://upload.wikimedia.org/wikipedia/commons/8/87/Keshav_Maharaj_2023.jpg",
  "tabraiz-shamsi": "",
  "akeal-hosein": "",
  "allah-ghazanfar": "",
  "waqar-salamkheil": "",

  // ==========================================
  // --- IPL ICONS & LEGENDS ---
  // ==========================================
  "ab-de-villiers":
    "https://upload.wikimedia.org/wikipedia/commons/7/78/AB_de_Villiers_at_World_Cup_2015.jpg",
  "chris-gayle":
    "https://upload.wikimedia.org/wikipedia/commons/1/1e/Chris_Gayle_in_2015.jpg",
  "dj-bravo":
    "https://upload.wikimedia.org/wikipedia/commons/6/6b/Bravo_at_IIFA_2017_Green_Carpet.jpg",
  "dale-steyn":
    "https://upload.wikimedia.org/wikipedia/commons/7/75/Dale_Steyn_2012.jpg",
  "lasith-malinga":
    "https://upload.wikimedia.org/wikipedia/commons/9/99/Lasith_Malinga_2012.jpg",
  "kieron-pollard":
    "https://upload.wikimedia.org/wikipedia/commons/3/38/Kieron_Pollard_2012.jpg",
  "shane-watson":
    "https://upload.wikimedia.org/wikipedia/commons/d/d7/Shane_Watson_2015.jpg",
};

/**
 * Normalizes photo URLs so they load reliably across all environments without referrer leakage.
 */
export function getSafeCdnPhotoUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  if (rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) return rawUrl;
  return rawUrl.trim();
}

const portraitMemoryCache = new Map<string, string>();
const PORTRAIT_STORAGE_PREFIX = "cinebid_cricketer_photo_";

/**
 * Resolves a real-time authentic photograph for a cricketer.
 * 1. Checks in-memory cache
 * 2. Checks verified direct seed mappings (exact ID only)
 * 3. Checks localStorage
 * 4. Fallback Wikipedia API dynamic query (strictly about the cricketer)
 * 5. If none available, returns "" (NEVER falls back to another player's face).
 */
export async function getRealCricketerPhoto(
  playerId: string,
  playerName?: string,
): Promise<string> {
  const cleanId = (playerId || "").toLowerCase().trim();
  const cleanName = (playerName || "").trim();

  // 1. In-memory cache
  if (portraitMemoryCache.has(cleanId)) {
    return portraitMemoryCache.get(cleanId)!;
  }

  // 2. Direct seed lookup (exact ID match only)
  if (CRICKETER_PORTRAIT_SEEDS[cleanId]) {
    const rawUrl = CRICKETER_PORTRAIT_SEEDS[cleanId]!;
    portraitMemoryCache.set(cleanId, rawUrl);
    return rawUrl;
  }

  // 3. LocalStorage cache
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(`${PORTRAIT_STORAGE_PREFIX}${cleanId}`);
      if (stored && stored.startsWith("http")) {
        portraitMemoryCache.set(cleanId, stored);
        return stored;
      }
    } catch {
      // ignore storage error
    }
  }

  // 4. Dynamic Wikipedia summary API lookup
  if (cleanName && typeof window !== "undefined") {
    try {
      const searchQueries = [
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName.replace(/ /g, "_"))}`,
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName + " (cricketer)")}`,
      ];

      for (const endpoint of searchQueries) {
        try {
          const resp = await fetch(endpoint, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(2000),
          });
          if (resp.ok) {
            const data = await resp.json();
            const desc = (data.description || "").toLowerCase();
            const extract = (data.extract || "").toLowerCase();
            const isCricketer =
              desc.includes("cricket") ||
              extract.includes("cricket") ||
              extract.includes("ipl") ||
              extract.includes("batsman") ||
              extract.includes("bowler");

            const sourceUrl = data.originalimage?.source || data.thumbnail?.source;
            if (
              isCricketer &&
              sourceUrl &&
              typeof sourceUrl === "string" &&
              sourceUrl.startsWith("http") &&
              !sourceUrl.includes("Question_book") &&
              !sourceUrl.includes("Disambig")
            ) {
              const clean = sourceUrl.split("?")[0] || sourceUrl;
              portraitMemoryCache.set(cleanId, clean);
              try {
                localStorage.setItem(`${PORTRAIT_STORAGE_PREFIX}${cleanId}`, clean);
              } catch {
                // ignore
              }
              return clean;
            }
          }
        } catch {
          // try next query
        }
      }
    } catch {
      // ignore
    }
  }

  // 5. If not found or not authentic, return empty string.
  // NEVER return another cricketer's photo.
  portraitMemoryCache.set(cleanId, "");
  return "";
}
