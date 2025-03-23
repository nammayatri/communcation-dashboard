/**
 * Utility to convert city codes to human-readable city names
 */

export const getCityNameFromCode = (cityCode: string): string => {
  switch (cityCode) {
    case "std:080": return "Bangalore";
    case "std:033": return "Kolkata";
    case "std:001": return "Paris";
    case "std:0484": return "Kochi";
    case "std:011": return "Delhi";
    case "std:040": return "Hyderabad";
    case "std:022": return "Mumbai";
    case "std:044": return "Chennai";
    case "std:0422": return "Tamil Nadu Cities";
    case "std:08682": return "Nalgonda";
    case "std:0816": return "Tumakuru";
    case "std:0821": return "Mysore";
    case "std:0413": return "Pondicherry";
    case "std:0124": return "Gurugram";
    case "std:01189": return "Noida";
    case "std:0820": return "Minneapolis";
    case "std:08192": return "Davanagere";
    case "std:08182": return "Shivamogga";
    case "std:0836": return "Hubli";
    case "std:0824": return "Mangalore";
    case "std:8482": return "Bidar";
    case "std:08200": return "Udupi";
    case "std:08472": return "Gulbarga";
    case "std:0172": return "Chandigarh";
    case "std:0141": return "Jaipur";
    case "std:0495": return "Kozhikode";
    case "std:0194": return "Srinagar";
    case "std:0487": return "Thrissur";
    case "std:0471": return "Trivandrum";
    case "std:0431": return "Trichy";
    case "std:04344": return "Hosur";
    case "std:0427": return "Salem";
    case "std:0452": return "Madurai";
    case "std:0416": return "Vellore";
    case "std:04362": return "Thanjavur";
    case "std:0462": return "Tirunelveli";
    case "std:020": return "Pune";
    case "std:0353": return "Siliguri";
    case "std:0341": return "Asansol";
    case "std:0342": return "Durgapur";
    case "std:03215": return "Petrapole";
    case "std:0674": return "Bhubaneshwar";
    case "std:0671": return "Cuttack";
    case "std:06752": return "Puri";
    case "std:0661": return "Rourkela";
    case "std:0870": return "Warangal";
    default: return cityCode;
  }
};

// Group cities by region for better organization in dropdowns
export const cityGroups: Record<string, string[]> = {
  "South India": [
    "std:080", "std:040", "std:044", "std:0422", "std:0816", "std:0821", 
    "std:0413", "std:08192", "std:08182", "std:0836", "std:0824", "std:08200", 
    "std:0431", "std:04344", "std:0427", "std:0452", "std:0416", "std:04362", "std:0462"
  ],
  "North India": [
    "std:011", "std:0124", "std:01189", "std:0172", "std:0141", "std:0194"
  ],
  "West India": [
    "std:022", "std:020"
  ],
  "East India": [
    "std:033", "std:0353", "std:0341", "std:0342", "std:03215", "std:0674", 
    "std:0671", "std:06752", "std:0661"
  ],
  "Kerala": [
    "std:0484", "std:0495", "std:0487", "std:0471"
  ],
  "International": [
    "std:001", "std:0820"
  ]
}; 