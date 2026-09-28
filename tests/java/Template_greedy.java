import java.util.*;

public class Template_greedy {
static long maximum(int[] a) {
    if(a.length==0)throw new IllegalArgumentException();
    long ending=a[0],best=a[0];
    for(int i=1;i<a.length;i++){ending=Math.max(a[i],ending+a[i]);best=Math.max(best,ending);}
    return best; // Nonempty subarray, so all-negative input is supported.
}
}
