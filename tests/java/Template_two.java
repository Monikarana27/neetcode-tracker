import java.util.*;

public class Template_two {
static int[] pair(int[] sorted, long target) {
    int l=0,r=sorted.length-1;
    while(l<r) {
        long sum=(long)sorted[l]+sorted[r];
        if(sum==target) return new int[]{l,r};
        if(sum<target) l++; else r--;
    }
    return new int[0]; // Zero-based indices; input must be sorted.
}
}
