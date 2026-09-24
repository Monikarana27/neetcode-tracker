import java.util.*;

public class Template_lru {
static class Cache extends LinkedHashMap<Integer,Integer> {
    final int capacity;
    Cache(int capacity) { super(16,0.75f,true); this.capacity=capacity; }
    protected boolean removeEldestEntry(Map.Entry<Integer,Integer> e) {
        return size()>capacity;
    }
} // Study the doubly linked node implementation as well.

}
