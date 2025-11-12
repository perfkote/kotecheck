import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Review {
  stars: string;
  text: string;
  name: string;
}

const reviews: Review[] = [
  {stars:"⭐⭐⭐⭐⭐", text:"expert pipe polishers.", name:"— Todd P., Orlando"},
  {stars:"⭐⭐⭐☆☆", text:"my husband left me because my engine wasn't hot enough.", name:"— Lisa from Accounts Payable"},
  {stars:"⭐⭐⭐⭐⭐", text:"I get alot of attention from other guys , so that's something .", name:"— Kyle L."},
  {stars:"⭐⭐⭐⭐⭐", text:"Dropped off my headers. Got it back shiny , it was being mined in Africa ", name:"— Steve '2-Bar' Johnson"},
  {stars:"⭐⭐☆☆☆", text:"owner made derogatory remarks about my EV", name:"— Dan R."},
  {stars:"⭐⭐⭐⭐⭐", text:"Hard and veiny. The perfect powder coat.", name:"— Chad V."},
  {stars:"⭐⭐⭐⭐⭐", text:"Got my pipes coated. Now I can see my future in the reflection. It's mostly debt, but still shiny.", name:"— Brent T."},
  {stars:"⭐⭐⭐⭐⭐", text:"The ad said  hot singles in my area . 10/10 would do again ", name:"— Rick 'The Bolt Guy' M."},
  {stars:"⭐⭐⭐⭐⭐", text:"forget the coating, they have a hole in the bathroom wall", name:"— Bill D."},
  {stars:"⭐⭐⭐⭐⭐", text:"Before Performance Kote: depression. After Performance Kote: still depression, but shinier.", name:"— Matt L."},
  {stars:"⭐⭐⭐⭐⭐", text:"Headers came back so polished my check engine light turned itself off.", name:"— Zach W."},
  {stars:"⭐⭐⭐⭐⭐", text:"They told me to 'let it cure.' I thought they meant emotionally. Turns out, both worked.", name:"— Kyle B."},
  {stars:"⭐⭐⭐⭐⭐", text:"The shop smells like power and broken dreams. Five stars.", name:"— Jason L."},
  {stars:"⭐⭐⭐⭐⭐", text:"They said it was heat resistant. It survived my mother-in-law's visit.", name:"— Terry K."}
];

export function ReviewsWidget() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeOut(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
        setFadeOut(false);
      }, 1000);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const currentReview = reviews[currentIndex];

  const handleFakeReview = () => {
    toast({
      title: "You're not ready.",
      variant: "destructive",
    });
  };

  return (
    <Card 
      className="p-3 sm:p-6 text-center transition-opacity duration-1000"
      style={{ opacity: fadeOut ? 0 : 1 }}
      data-testid="card-reviews-widget"
    >
      <div className="text-xl sm:text-2xl mb-2 sm:mb-3" data-testid="text-review-stars">
        {currentReview.stars}
      </div>
      <div className="text-sm sm:text-base leading-snug sm:leading-relaxed mb-2 sm:mb-3" data-testid="text-review-content">
        "{currentReview.text}"
      </div>
      <div className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4" data-testid="text-review-author">
        {currentReview.name}
      </div>
      <Button 
        variant="secondary"
        size="sm"
        onClick={handleFakeReview}
        data-testid="button-write-review"
      >
        Write a Review
      </Button>
    </Card>
  );
}
