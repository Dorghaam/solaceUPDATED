import Foundation
import WidgetKit

final class SharedDataManager {
    // Singleton instance using the App Group ID
    static let shared: SharedDataManager? = {
        guard let defaults = UserDefaults(suiteName: "group.com.dorghaamhaidar.solace.iphone") else {
            print("❌ SharedDataManager: Could not initialize UserDefaults with App Group")
            return nil
        }
        print("✅ SharedDataManager: Successfully initialized with App Group")
        return SharedDataManager(userDefaults: defaults)
    }()

    private let userDefaults: UserDefaults

    private init(userDefaults: UserDefaults) {
        self.userDefaults = userDefaults
    }

    // Quote structure for widget storage
    struct WidgetQuote: Codable {
        let id: String
        let text: String
    }

    // Saves an array of quote objects to the shared container
    func saveQuotes(_ quotes: [WidgetQuote]) {
        print("📝 SharedDataManager: Saving \(quotes.count) quote objects.")
        
        do {
            let encodedData = try JSONEncoder().encode(quotes)
            userDefaults.set(encodedData, forKey: "widgetQuotesData")
            userDefaults.synchronize() // Force synchronization
            print("✅ SharedDataManager: Successfully saved quote objects")
        } catch {
            print("❌ SharedDataManager: Failed to encode quote objects: \(error)")
            // Fallback to old method for backward compatibility
            let texts = quotes.map { $0.text }
            userDefaults.set(texts, forKey: "widgetQuotesArray")
            userDefaults.synchronize()
        }
    }

    // Loads the array of quote objects from the shared container
    func loadQuotes() -> [WidgetQuote] {
        // Try to load new format first
        if let encodedData = userDefaults.data(forKey: "widgetQuotesData") {
            do {
                let quotes = try JSONDecoder().decode([WidgetQuote].self, from: encodedData)
                print("📖 SharedDataManager: Loaded \(quotes.count) quote objects.")
                return quotes
            } catch {
                print("❌ SharedDataManager: Failed to decode quote objects: \(error)")
            }
        }
        
        // Fallback to old format for backward compatibility
        if let texts = userDefaults.stringArray(forKey: "widgetQuotesArray") {
            let quotes = texts.enumerated().map { index, text in
                WidgetQuote(id: "legacy-\(index)", text: text)
            }
            print("📖 SharedDataManager: Loaded \(quotes.count) quotes from legacy format.")
            return quotes
        }
        
        print("📖 SharedDataManager: No quotes found.")
        return []
    }
    
    // Convenience method to get just the text (for backward compatibility with widget display)
    func loadQuoteTexts() -> [String] {
        return loadQuotes().map { $0.text }
    }
    
    // Save user name for personalized widget content
    func saveUserName(_ name: String) {
        print("📝 SharedDataManager: Saving user name: \(name)")
        userDefaults.set(name, forKey: "widgetUserName")
        userDefaults.synchronize()
    }
    
    // Load user name for personalized widget content
    func loadUserName() -> String? {
        let name = userDefaults.string(forKey: "widgetUserName")
        print("📖 SharedDataManager: Loaded user name: \(name ?? "nil")")
        return name
    }
} 