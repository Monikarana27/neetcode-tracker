import java.util.*;

public class Template_hash {
static int[] twoSum(int[] a, int target) {
    Map<Integer,Integer> seen = new HashMap<>();
    for (int i=0;i<a.length;i++) {
        // Look up first: do not reuse the current element.
        long need = (long)target-a[i];
        if (need>=Integer.MIN_VALUE && need<=Integer.MAX_VALUE && seen.containsKey((int)need))
            return new int[]{seen.get((int)need),i};
        seen.put(a[i],i);
    }
    return new int[0];
}
}
