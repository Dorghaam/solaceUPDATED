import Foundation
import WidgetKit

final class SharedDataManager {
    // Singleton instance using the App Group ID
    static let shared: SharedDataManager? = {
        guard let defaults = UserDefaults(suiteName: "group.com.dorghaamhaidar.solace.iphone.widget") else {
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

    // Saves an array of quote strings to the shared container
    func saveQuotes(_ quotes: [String]) {
        print("📝 SharedDataManager: Saving \(quotes.count) quotes.")
        userDefaults.set(quotes, forKey: "widgetQuotesArray")
        userDefaults.synchronize() // Force synchronization
    }

    // Loads the array of quote strings from the shared container
    func loadQuotes() -> [String] {
        let quotes = userDefaults.stringArray(forKey: "widgetQuotesArray") ?? []
        print("📖 SharedDataManager: Loaded \(quotes.count) quotes.")
        return quotes
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