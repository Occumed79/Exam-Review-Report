# ☢️ Nuclear Fuel API Setup Guide
## Powering the SME Risk Intelligence Engine

To unlock the full potential of the platform, you need to connect it to real-world data sources. Below is a list of the free and freemium APIs you should set up.

---

## 1. Core Intelligence APIs

| API Name | Purpose | Account Type | Link |
| :--- | :--- | :--- | :--- |
| **OpenAI API** | Powers the Three-Judge Panel and Neural Processing | Freemium (Rate Limited) | [platform.openai.com](https://platform.openai.com/) |
| **O*NET Web Services** | Provides Essential Job Functions and DOL data | Free (Developer Account) | [services.onetcenter.org](https://services.onetcenter.org/) |
| **PubMed / Entrez API** | Fetches latest clinical research and case law | Free (Public Access) | [ncbi.nlm.nih.gov](https://www.ncbi.nlm.nih.gov/home/develop/api/) |
| **BLS Public Data API** | Provides occupational injury and fatality stats | Free (Public Access) | [bls.gov/developers](https://www.bls.gov/developers/) |

---

## 2. Clinical & Regulatory APIs

| API Name | Purpose | Account Type | Link |
| :--- | :--- | :--- | :--- |
| **NLM RxNav API** | Drug-drug interactions and medication data | Free (Public Access) | [lhncbc.nlm.nih.gov](https://lhncbc.nlm.nih.gov/RxNav/APIs/) |
| **CDC Wonder API** | Public health and mortality statistics | Free (Public Access) | [wonder.cdc.gov](https://wonder.cdc.gov/) |
| **OSHA Data API** | Workplace safety and violation history | Free (Public Access) | [osha.gov/data](https://www.osha.gov/data) |
| **ClinicalTrials.gov API** | Latest clinical trial data for condition progression | Free (Public Access) | [clinicaltrials.gov/api](https://clinicaltrials.gov/api) |

---

## 3. Step-by-Step "Hand-Holding" Setup

### **Step 1: Create Your Accounts**
Go to each of the links above and sign up for a "Developer" or "API" account. Most are free or have a generous free tier.

### **Step 2: Generate Your API Keys**
Once logged in, look for a section called "API Keys," "Developer Dashboard," or "Credentials." Click "Create New Key" and copy it.

### **Step 3: Configure the Portal**
1. Open the `.env` file in the project root (or create one if it doesn't exist).
2. Paste your keys in the following format:
   ```env
   OPENAI_API_KEY=your_key_here
   ONET_API_KEY=your_key_here
   PUBMED_API_KEY=your_key_here
   BLS_API_KEY=your_key_here
   RXNAV_API_KEY=your_key_here
   ```
3. Save the file.

### **Step 4: Verify Connection**
Launch the portal and go to the **"Nuclear Fuel"** tab. The system will automatically test each connection and show a green "Connected" status for each active API.

---

## 4. Troubleshooting
- **Rate Limits**: If an API shows "Rate Limited," it means you've made too many requests. Wait a few minutes or consider a paid tier if your volume is high.
- **Invalid Key**: Double-check that you copied the entire key without any extra spaces.
- **Network Error**: Ensure your firewall allows outgoing connections to these API domains.

---

*Need help? Contact your technical lead or refer to the individual API documentation linked above.*
