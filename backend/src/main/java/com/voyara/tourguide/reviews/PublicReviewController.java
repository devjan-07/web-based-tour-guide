package com.voyara.tourguide.reviews;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reviews")
public class PublicReviewController {
    private final ReviewRatingService reviewRatingService;

    public PublicReviewController(ReviewRatingService reviewRatingService) {
        this.reviewRatingService = reviewRatingService;
    }

    @GetMapping("/{targetType}/{targetId}")
    public ReviewSummary byTarget(@PathVariable String targetType, @PathVariable Long targetId) {
        return reviewRatingService.summarizeCompleted(targetType, targetId);
    }
}
