package com.vitatrack.food;

import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FoodService {

    private final FoodItemRepository foodItemRepository;

    public List<FoodItem> searchFoods(String query) {
        String safeQuery = query == null ? "" : query.trim();
        return foodItemRepository.searchByName(safeQuery);
    }
}
