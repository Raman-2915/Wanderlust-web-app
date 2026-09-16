require("dotenv").config();
const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const dbUrl = process.env.ATLASDB_URL;
const demoUsername = process.env.DEMO_HOST_USERNAME;

const demoListings = [
  { title: "Sunset Beach Villa", description: "A bright coastal villa with open living spaces, a private pool, and an easy walk to the beach.", price: 4200, location: "Goa", country: "India", image: { filename: "demo-goa-villa", url: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1200&q=80" } },
  { title: "Pinewood Mountain Cottage", description: "A peaceful wooden cottage surrounded by pine trees, perfect for a quiet mountain escape.", price: 2800, location: "Manali", country: "India", image: { filename: "demo-manali-cottage", url: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80" } },
  { title: "Blue City Heritage Haveli", description: "A character-filled heritage stay with traditional details and a memorable view of the old city.", price: 3200, location: "Jodhpur", country: "India", image: { filename: "demo-jodhpur-haveli", url: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80" } },
  { title: "Lakeview Courtyard Home", description: "Relax in a stylish courtyard home close to the lake, local markets, and historic streets.", price: 3900, location: "Udaipur", country: "India", image: { filename: "demo-udaipur-home", url: "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1200&q=80" } },
  { title: "Riverside Forest Cabin", description: "A cosy riverside cabin surrounded by greenery, made for slow mornings and outdoor adventures.", price: 2500, location: "Rishikesh", country: "India", image: { filename: "demo-rishikesh-cabin", url: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1200&q=80" } },
  { title: "Minimal Coastal Retreat", description: "A calm modern retreat near the promenade with natural light, comfortable interiors, and sea breezes.", price: 3000, location: "Pondicherry", country: "India", image: { filename: "demo-pondicherry-retreat", url: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80" } },
  { title: "Golden Fort View Stay", description: "A warm and welcoming stay with rooftop views and quick access to the city's famous landmarks.", price: 2300, location: "Jaipur", country: "India", image: { filename: "demo-jaipur-stay", url: "https://images.unsplash.com/photo-1599661046827-dacff0c7e9f7?auto=format&fit=crop&w=1200&q=80" } },
  { title: "Valley View Wooden Lodge", description: "Wake up to mountain scenery from this comfortable lodge with a quiet, nature-first atmosphere.", price: 2700, location: "Kasol", country: "India", image: { filename: "demo-kasol-lodge", url: "https://images.unsplash.com/photo-1544986581-efac024faf62?auto=format&fit=crop&w=1200&q=80" } },
  { title: "Palm Garden Hideaway", description: "A tropical hideaway with a relaxed garden setting, ideal for a peaceful weekend near the coast.", price: 3500, location: "Alibaug", country: "India", image: { filename: "demo-alibaug-hideaway", url: "https://images.unsplash.com/photo-1582610116397-edb318620f90?auto=format&fit=crop&w=1200&q=80" } },
  { title: "Snowline Chalet", description: "A warm chalet-style stay with dramatic mountain views and a cosy interior for winter trips.", price: 4500, location: "Shimla", country: "India", image: { filename: "demo-shimla-chalet", url: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80" } },
  { title: "Cliffside Sea Escape", description: "A scenic coastal home with wide sea views, a relaxed terrace, and room for a small group.", price: 5200, location: "Varkala", country: "India", image: { filename: "demo-varkala-escape", url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80" } },
  { title: "Backwater Garden Villa", description: "A serene Kerala villa surrounded by tropical greenery, perfect for a slow and comfortable stay.", price: 4800, location: "Alappuzha", country: "India", image: { filename: "demo-alleppey-villa", url: "https://images.unsplash.com/photo-1601918774946-25832a4be0d6?auto=format&fit=crop&w=1200&q=80" } },
  { title: "Santorini White Haven", description: "A bright island retreat with clean Mediterranean design and beautiful views over the Aegean.", price: 8500, location: "Santorini", country: "Greece", image: { filename: "demo-santorini", url: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80" } },
  { title: "Bali Garden Pool House", description: "A private tropical home with lush gardens and a refreshing pool for an easy island getaway.", price: 6200, location: "Bali", country: "Indonesia", image: { filename: "demo-bali", url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80" } },
  { title: "Amalfi Terrace Retreat", description: "A charming Mediterranean stay with a sunny terrace and easy access to the coast and village streets.", price: 9200, location: "Amalfi", country: "Italy", image: { filename: "demo-amalfi", url: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80" } },
  { title: "Alpine Glass Cabin", description: "A modern glass-front cabin designed around the landscape, with peaceful views of the Swiss Alps.", price: 11000, location: "Interlaken", country: "Switzerland", image: { filename: "demo-interlaken", url: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80" } },
  { title: "Old Town Lisbon Apartment", description: "A stylish city apartment close to cafés, historic streets, viewpoints, and Lisbon's local life.", price: 6800, location: "Lisbon", country: "Portugal", image: { filename: "demo-lisbon", url: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=80" } },
  { title: "Desert Courtyard Retreat", description: "A peaceful desert-inspired stay with elegant interiors, a private courtyard, and sunset views.", price: 7600, location: "Dubai", country: "United Arab Emirates", image: { filename: "demo-dubai", url: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80" } },
  { title: "Kyoto Garden Machiya", description: "A traditional-inspired Kyoto stay combining quiet garden spaces with easy access to the old city.", price: 7900, location: "Kyoto", country: "Japan", image: { filename: "demo-kyoto", url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80" } }
];

async function seed() {
  if (!dbUrl) throw new Error("ATLASDB_URL is required");
  if (!demoUsername) throw new Error("DEMO_HOST_USERNAME is required");

  await mongoose.connect(dbUrl);
  const host = await User.findOne({ username: demoUsername });
  if (!host) throw new Error(`Demo host '${demoUsername}' was not found`);

  let created = 0;
  let skipped = 0;
  for (const data of demoListings) {
    const exists = await Listing.exists({ owner: host._id, title: data.title });
    if (exists) {
      skipped += 1;
      continue;
    }
    await Listing.create({ ...data, owner: host._id });
    created += 1;
  }
  console.log(`Demo stays: ${created} created, ${skipped} already existed.`);
}

seed()
  .catch((err) => {
    console.error("Demo stay seeding failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
