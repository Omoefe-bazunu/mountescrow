"use client";

import { useEffect, useState } from "react";
import { Star, PlusCircle, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db, storage } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const styles = `
  @keyframes slideIn {
    0% { opacity: 0; transform: translateX(100%); }
    100% { opacity: 1; transform: translateX(0); }
  }

  @keyframes slideOut {
    0% { opacity: 1; transform: translateX(0); }
    100% { opacity: 0; transform: translateX(-100%); }
  }

  .slide-enter {
    animation: slideIn 0.8s ease forwards;
  }

  .slide-exit {
    animation: slideOut 0.8s ease forwards;
  }

  .half-visible {
    transform: scale(0.9);
    opacity: 0.6;
    filter: blur(1px);
  }

  .animate-fadeIn {
    animation: fadeIn 1s ease-in-out forwards;
  }

  @keyframes fadeIn {
    from { opacity: 0 }
    to { opacity: 1 }
  }
`;

export default function TestimonialsSection() {
  const { user } = useAuth();
  const [testimonials, setTestimonials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    authorName: "",
    authorTitle: "",
    review: "",
    rating: 5,
    photo: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch testimonials in real time
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "testimonials"),
      (snapshot) => {
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTestimonials(fetched);
        setCurrentIndex(0);
      }
    );
    return () => unsubscribe();
  }, []);

  // Auto-slide carousel
  useEffect(() => {
    if (testimonials.length > 1) {
      const timer = setTimeout(() => {
        setIsSliding(true);
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % testimonials.length);
          setIsSliding(false);
        }, 800);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, testimonials]);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, photo: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let photoUrl = "";
      if (formData.photo) {
        const userId = user?.uid || "guest";
        const photoRef = ref(
          storage,
          `testimonials/${userId}/${Date.now()}_${formData.photo.name}`
        );
        await uploadBytes(photoRef, formData.photo);
        photoUrl = await getDownloadURL(photoRef);
      }

      await addDoc(collection(db, "testimonials"), {
        authorName: formData.authorName,
        authorTitle: formData.authorTitle,
        review: formData.review,
        rating: Number(formData.rating),
        photoUrl,
        userId: user?.uid || "guest",
        createdAt: serverTimestamp(),
      });

      setFormData({
        authorName: "",
        authorTitle: "",
        review: "",
        rating: 5,
        photo: null,
      });
      setShowModal(false);
    } catch (err) {
      console.error("Error adding testimonial:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating) =>
    [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "text-yellow-400" : "text-gray-300"}`}
        fill={i < rating ? "currentColor" : "none"}
      />
    ));

  const current = testimonials[currentIndex];
  const next = testimonials[(currentIndex + 1) % testimonials.length];

  return (
    <div
      className="bg-background py-20 px-4 md:px-20 text-center relative"
      style={{
        backgroundImage:
          "url('https://firebasestorage.googleapis.com/v0/b/penned-aae02.appspot.com/o/General%2FtestimonialbgImage.jpg?alt=media&token=bc374504-4a64-4511-b9b2-3f432d76bbcb')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      <style>{styles}</style>

      <h2 className="text-primary-blue font-semibold font-headline text-3xl md:text-4xl mb-6 animate-fadeIn">
        HEAR FROM OUR USERS
      </h2>
      <p
        className="text-muted-foreground max-w-3xl mx-auto mb-12 font-body animate-fadeIn"
        style={{ animationDelay: "0.2s" }}
      >
        Hear from those who already use Mountescrow to power safe and secure
        payments.
      </p>

      {/* CTA */}
      {user ? (
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 mx-auto mb-10 bg-orange-500 hover:bg-highlight-blue text-white px-5 py-3 rounded-full transition-all"
        >
          <PlusCircle size={18} />
          Add Your Testimonial
        </button>
      ) : (
        <a
          href="/login"
          className="text-sm text-muted-foreground bg-orange-500 px-4 py-2 rounded-full hover:bg-highlight-blue text-white transition-all block w-fit mx-auto mb-10"
        >
          Log in to leave a review
        </a>
      )}

      {/* Fallback if no testimonials */}
      {testimonials.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white/70 rounded-2xl shadow-lg mx-auto w-[80%] md:w-[50%]">
          <p className="text-gray-600 text-lg font-medium mb-2">
            No reviews yet.
          </p>
          <p className="text-sm text-gray-500">
            Be the first to share your experience with Mountescrow!
          </p>
        </div>
      ) : (
        <div className="relative flex justify-center items-center overflow-hidden h-[400px]">
          {/* Active Card */}
          <div
            className={`absolute transition-all duration-700 ease-in-out ${
              isSliding ? "slide-exit" : "z-20"
            } w-[80%] md:w-[50%] bg-white p-8 rounded-2xl shadow-xl mx-auto`}
          >
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-6 border-4 border-primary-blue flex items-center justify-center bg-gray-50">
                <img
                  src={current.photoUrl}
                  alt={current.authorName}
                  className="object-cover w-full h-full bg-slate-600"
                />
              </div>
              <p className="text-card-foreground italic mb-4 text-lg font-body">
                “{current.review}”
              </p>
              <div className="flex flex-col items-center">
                <div className="flex justify-center mb-2">
                  {renderStars(current.rating)}
                </div>
                <p className="text-primary font-semibold text-lg">
                  {current.authorName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {current.authorTitle}
                </p>
              </div>
            </div>
          </div>

          {/* Next Card */}
          {next && (
            <div
              className={`absolute right-0 transition-transform duration-700 ${
                isSliding ? "slide-enter" : "half-visible"
              } w-[60%] md:w-[40%] bg-white p-6 rounded-2xl shadow-lg translate-x-[25%]`}
            >
              <div className="flex flex-col items-center opacity-80">
                <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-primary-blue flex items-center justify-center bg-gray-50">
                  <img
                    src={next.photoUrl}
                    alt={next.authorName}
                    className="object-cover w-full h-full"
                  />
                </div>
                <p className="text-sm italic text-gray-600 line-clamp-3">
                  “{next.review}”
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-[90%] md:w-[450px] relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-semibold mb-4 text-primary">
              Add Testimonial
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                name="authorName"
                value={formData.authorName}
                onChange={handleInputChange}
                placeholder="Your Name"
                required
                className="border rounded-lg p-2"
              />
              <input
                name="authorTitle"
                value={formData.authorTitle}
                onChange={handleInputChange}
                placeholder="Your Title (e.g. Buyer, Freelancer)"
                required
                className="border rounded-lg p-2"
              />
              <textarea
                name="review"
                value={formData.review}
                onChange={handleInputChange}
                placeholder="Your Review"
                required
                className="border rounded-lg p-2 h-24 resize-none"
              />
              <input
                type="number"
                name="rating"
                value={formData.rating}
                onChange={handleInputChange}
                min="1"
                max="5"
                className="border rounded-lg p-2"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="border rounded-lg p-2"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary-blue text-white rounded-lg py-2 hover:bg-primary/80 transition-all"
              >
                {isSubmitting ? "Submitting..." : "Submit Testimonial"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
